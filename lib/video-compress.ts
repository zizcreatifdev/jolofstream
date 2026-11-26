"use client"

// Compression des vidéos MP4 du hero dans le navigateur (WebCodecs via
// mediabunny). Module chargé à la demande par import dynamique, uniquement
// dans l'admin : il n'entre dans aucun bundle du site public.

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSink,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny"

export const MAX_HERO_VIDEO_SECONDS = 60
export const HERO_VIDEO_LIMIT_BYTES = 15 * 1024 * 1024
export const TOO_LONG_MESSAGE = "Vidéo trop longue pour un fond de hero : ajoutez-la plutôt en lien YouTube"
export const UNSUPPORTED_MESSAGE =
  "Votre navigateur ne peut pas compresser cette vidéo : utilisez Chrome ou Edge à jour, ou ajoutez-la en lien YouTube"

const TARGET_BYTES = 14 * 1024 * 1024
const MAX_VIDEO_BITRATE = 5_000_000
const MIN_VIDEO_BITRATE = 1_500_000
const AUDIO_BITRATE = 128_000

export class VideoCompressionError extends Error {
  constructor(
    message: string,
    readonly reason: "too_long" | "unsupported" | "cancelled" | "unreadable" | "too_big"
  ) {
    super(message)
  }
}

export type CompressedVideo = {
  blob: Blob
  width: number
  height: number
  duration: number
  bitrate: number
  hasAudio: boolean
  originalSize: number
  poster: Blob | null
  // Original déjà conforme et plus léger que le résultat : envoyé tel quel
  kept: boolean
}

// WebCodecs avec encodage H.264 disponible (sinon repli)
export async function canCompressVideo(): Promise<boolean> {
  if (typeof window === "undefined" || typeof VideoEncoder === "undefined") return false
  try {
    return await canEncodeVideo("avc", { width: 1280, height: 720, bitrate: 2_000_000 })
  } catch {
    return false
  }
}

// Dimensions de sortie : 1080p au plus (1920 x 1080 en paysage, 1080 x 1920
// en portrait), jamais d'agrandissement, valeurs paires ; 720p pour le
// dernier essai
function outputSize(width: number, height: number, maxLong = 1920, maxShort = 1080) {
  const long = Math.max(width, height)
  const short = Math.min(width, height)
  const scale = Math.min(1, maxLong / long, maxShort / short)
  const even = (n: number) => Math.max(2, Math.floor((n * scale) / 2) * 2)
  return { width: even(width), height: even(height) }
}

// Débit vidéo : min(5 Mb/s, 14 Mo x 8 / durée), plancher 1,5 Mb/s
export function videoBitrate(duration: number): number {
  const budget = (TARGET_BYTES * 8) / Math.max(1, duration)
  return Math.round(Math.max(MIN_VIDEO_BITRATE, Math.min(MAX_VIDEO_BITRATE, budget)))
}

export async function compressHeroVideo(
  file: File,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<CompressedVideo> {
  if (!(await canCompressVideo())) throw new VideoCompressionError(UNSUPPORTED_MESSAGE, "unsupported")

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  let videoTrack
  let duration
  try {
    videoTrack = await input.getPrimaryVideoTrack()
    duration = await input.computeDuration()
  } catch {
    throw new VideoCompressionError("Vidéo illisible : MP4, MOV ou WebM attendu.", "unreadable")
  }
  if (!videoTrack) throw new VideoCompressionError("Aucune piste vidéo dans ce fichier.", "unreadable")
  if (duration > MAX_HERO_VIDEO_SECONDS) throw new VideoCompressionError(TOO_LONG_MESSAGE, "too_long")
  if (!(await videoTrack.canDecode())) throw new VideoCompressionError(UNSUPPORTED_MESSAGE, "unsupported")

  const audioTrack = await input.getPrimaryAudioTrack()
  const hasAudio = Boolean(audioTrack && (await audioTrack.canDecode()))
  // AAC : encodeur natif, sinon encodeur WASM de mediabunny (chargé à la demande)
  if (hasAudio && !(await canEncodeAudio("aac", { bitrate: AUDIO_BITRATE }))) {
    const { registerAacEncoder } = await import("@mediabunny/aac-encoder")
    registerAacEncoder()
  }

  const size = outputSize(videoTrack.displayWidth, videoTrack.displayHeight)
  if (!(await canEncodeVideo("avc", { width: size.width, height: size.height, bitrate: MIN_VIDEO_BITRATE }))) {
    throw new VideoCompressionError(UNSUPPORTED_MESSAGE, "unsupported")
  }
  // 30 images par seconde au plus (jamais d'images ajoutées) ; débit
  // plafonné à celui de la source (réencoder plus haut alourdit sans gain)
  let frameRate: number | undefined
  let sourceBitrate = Infinity
  try {
    const stats = await videoTrack.computePacketStats(120)
    if (stats.averagePacketRate > 30.5) frameRate = 30
    if (stats.averageBitrate > 0) sourceBitrate = stats.averageBitrate
  } catch {
    frameRate = 30
  }
  // Original déjà au bon format (MP4 H.264, 1080p et 30 i/s au plus, son
  // AAC ou absent) : il peut être gardé s'il est plus léger que le résultat
  const audioCodec = audioTrack ? audioTrack.codec : null
  const originalFits =
    file.type === "video/mp4" &&
    videoTrack.codec === "avc" &&
    frameRate === undefined &&
    size.width === videoTrack.displayWidth &&
    size.height === videoTrack.displayHeight &&
    (audioCodec === null || audioCodec === "aac") &&
    file.size <= HERO_VIDEO_LIMIT_BYTES

  const bitrate = Math.round(Math.min(videoBitrate(duration), Math.max(500_000, sourceBitrate)))
  // Trois essais si le fichier dépasse 15 Mo : débit cible, puis débit réduit
  // d'un quart, puis 720p (sur une image très chargée, l'encodeur logiciel
  // peut dépasser nettement le débit demandé en 1080p)
  const small = outputSize(videoTrack.displayWidth, videoTrack.displayHeight, 1280, 720)
  const attempts = [
    { ...size, bitrate },
    { ...size, bitrate: Math.round(bitrate * 0.75) },
    { ...small, bitrate: Math.round(bitrate * 0.75) },
  ]
  for (let index = 0; index < attempts.length; index++) {
    const attempt = attempts[index]
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() })
    const conversion = await Conversion.init({
      input,
      output,
      video: {
        codec: "avc",
        width: attempt.width,
        height: attempt.height,
        fit: "contain",
        frameRate,
        quality: new Quality({ bitrate: attempt.bitrate }),
        forceTranscode: true,
        allowTransformationMetadata: false,
      },
      audio: hasAudio
        ? { codec: "aac", quality: new Quality({ bitrate: AUDIO_BITRATE }), forceTranscode: true }
        : { discard: true },
      tags: {},
    })
    if (!conversion.isValid) throw new VideoCompressionError(UNSUPPORTED_MESSAGE, "unsupported")
    if (options.signal?.aborted) throw new VideoCompressionError("Compression annulée.", "cancelled")
    const onAbort = () => void conversion.cancel()
    options.signal?.addEventListener("abort", onAbort, { once: true })
    conversion.onProgress = (progress) => options.onProgress?.(Math.min(0.97, progress))
    try {
      await conversion.execute()
    } catch (error) {
      if (options.signal?.aborted) throw new VideoCompressionError("Compression annulée.", "cancelled")
      throw error
    } finally {
      options.signal?.removeEventListener("abort", onAbort)
    }
    if (options.signal?.aborted) throw new VideoCompressionError("Compression annulée.", "cancelled")
    const buffer = (output.target as BufferTarget).buffer
    if (!buffer) throw new Error("Compression vidéo sans résultat.")
    if (buffer.byteLength <= HERO_VIDEO_LIMIT_BYTES || originalFits) {
      const poster = await extractPoster(videoTrack, duration).catch(() => null)
      options.onProgress?.(1)
      const kept = originalFits && file.size <= buffer.byteLength
      return {
        blob: kept ? file : new Blob([buffer], { type: "video/mp4" }),
        kept,
        width: kept ? size.width : attempt.width,
        height: kept ? size.height : attempt.height,
        duration,
        bitrate: attempt.bitrate,
        hasAudio,
        originalSize: file.size,
        poster,
      }
    }
    // Débit très largement dépassé : l'encodeur ne suit pas en 1080p, on passe
    // directement au 720p
    const expected = ((attempt.bitrate + (hasAudio ? AUDIO_BITRATE : 0)) * duration) / 8
    if (index === 0 && buffer.byteLength > expected * 1.5) index = attempts.length - 2
  }
  throw new VideoCompressionError("Vidéo trop lourde après compression : raccourcissez-la ou ajoutez-la en lien YouTube.", "too_big")
}

// Image à 1 s (ou première image si la vidéo est plus courte), en PNG, à
// compresser ensuite avec le profil hero-poster
async function extractPoster(
  track: NonNullable<Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>>,
  duration: number
): Promise<Blob | null> {
  const sink = new CanvasSink(track, { poolSize: 1 })
  const first = await track.getFirstTimestamp()
  const at = duration > 1 ? first + 1 : first
  const wrapped = await sink.getCanvas(at)
  if (!wrapped) return null
  const canvas = wrapped.canvas
  if ("convertToBlob" in canvas) return (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" })
  return new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, "image/png"))
}
