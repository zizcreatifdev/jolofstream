"use client"

import { useEffect, useRef, useState } from "react"
import { Film, ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { uploadRule, type UploadTarget } from "@/lib/storage-buckets"
import { formatBytes, optimizedMessage, type ImageProfileName } from "@/lib/image-profiles"
import { IMAGE_ACCEPT, compressImage, extensionFor } from "@/lib/image-resize"
import { uploadBlob } from "@/lib/signed-upload-client"

const VIDEO_ACCEPT = ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"

type Phase = null | "compression" | "envoi" | "couverture"

// Téléversement d'un média (vidéo ou image du hero, image de contenu du
// bucket site) directement vers Supabase Storage via une URL signée. Les
// images sont compressées dans le navigateur selon leur profil
// (lib/image-profiles.ts) ; les vidéos du hero sont compressées en MP4 H.264
// (lib/video-compress.ts, chargé à la demande) et leur couverture est
// extraite automatiquement (onPoster). L'ancien fichier est supprimé par le
// serveur à l'enregistrement du contenu qui le référence.
export function MediaUpload({
  target,
  profile,
  id,
  value,
  onChange,
  onPoster,
  label,
  hint,
  required = false,
  error,
}: {
  target: UploadTarget
  // Profil de compression d'une image (sans objet pour une vidéo)
  profile?: ImageProfileName
  id?: string
  value: string | null
  onChange: (url: string | null) => void
  // Vidéo : couverture extraite et compressée (profil hero-poster)
  onPoster?: (url: string) => void
  label: string
  hint?: string
  required?: boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const rules = uploadRule(target)
  const kind = target.kind
  const isVideo = kind === "video"
  const inputId = id ?? `media-${target.bucket}-${kind}`
  const busy = phase !== null

  // Fermer ou quitter la page pendant une compression ou un envoi : alerte
  useEffect(() => {
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [busy])

  const reset = () => {
    setMessage(null)
    setResult(null)
    setWarning(null)
    setProgress(0)
  }

  const uploadImage = async (file: File) => {
    if (!profile) return
    setPhase("compression")
    const image = await compressImage(file, profile)
    setPhase("envoi")
    const signed = await uploadBlob({
      bucket: target.bucket,
      kind,
      fileName: `${file.name.replace(/\.[^.]+$/, "") || "image"}.${extensionFor(image.type)}`,
      blob: image.blob,
      contentType: image.type,
      onProgress: setProgress,
    })
    onChange(signed.publicUrl)
    setResult(optimizedMessage("Image", image.originalSize, image.blob.size))
    if (target.bucket === "hero" && kind === "poster" && (image.width < 1600 || Math.abs(image.width / image.height - 16 / 9) > 0.05)) {
      setWarning(`Image de ${image.width} x ${image.height} px : 1920 x 1080 recommandé pour un rendu net en plein écran.`)
    }
  }

  const uploadVideo = async (file: File) => {
    setPhase("compression")
    const video = await import("@/lib/video-compress")
    const supported = await video.canCompressVideo()
    if (!supported) {
      // Repli : envoi tel quel s'il respecte déjà la limite du bucket
      if (file.size <= video.HERO_VIDEO_LIMIT_BYTES && (rules.types as readonly string[]).includes(file.type)) {
        setPhase("envoi")
        const signed = await uploadBlob({ bucket: target.bucket, kind, fileName: file.name, blob: file, contentType: file.type, onProgress: setProgress })
        onChange(signed.publicUrl)
        setWarning(
          `Vidéo envoyée sans compression (${formatBytes(file.size)}) : votre navigateur ne sait pas la compresser. Pour une vidéo plus lourde, utilisez Chrome ou Edge à jour, ou un lien YouTube.`
        )
        return
      }
      throw new Error(video.UNSUPPORTED_MESSAGE)
    }
    const controller = new AbortController()
    abortRef.current = controller
    const compressed = await video.compressHeroVideo(file, { onProgress: setProgress, signal: controller.signal })
    abortRef.current = null
    setPhase("envoi")
    setProgress(0)
    const signed = await uploadBlob({
      bucket: target.bucket,
      kind,
      fileName: `${file.name.replace(/\.[^.]+$/, "") || "video"}.mp4`,
      blob: compressed.blob,
      contentType: "video/mp4",
      onProgress: setProgress,
    })
    onChange(signed.publicUrl)
    const details = `${compressed.width} x ${compressed.height}${compressed.hasAudio ? ", son conservé" : ", sans piste son"}`
    setResult(
      compressed.kept
        ? `Vidéo déjà optimisée : ${formatBytes(compressed.originalSize)}, envoyée telle quelle (${details})`
        : `${optimizedMessage("Vidéo", compressed.originalSize, compressed.blob.size)} (${details})`
    )
    // Couverture extraite à 1 s, compressée avec le profil hero-poster
    if (compressed.poster && onPoster) {
      setPhase("couverture")
      const poster = await compressImage(compressed.poster, "hero-poster")
      const signedPoster = await uploadBlob({
        bucket: target.bucket,
        kind: "poster",
        fileName: `couverture.${extensionFor(poster.type)}`,
        blob: poster.blob,
        contentType: poster.type,
      })
      onPoster(signedPoster.publicUrl)
      setWarning("Couverture extraite de la vidéo à 1 s : vous pouvez la remplacer par une autre image.")
    }
  }

  const upload = async (file: File) => {
    reset()
    try {
      if (isVideo) await uploadVideo(file)
      else await uploadImage(file)
    } catch (e) {
      const text = e instanceof Error ? e.message : "Téléversement impossible."
      setMessage(text === "Failed to fetch" ? "Connexion impossible. Réessayez." : text)
    } finally {
      abortRef.current = null
      setPhase(null)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const Icon = isVideo ? Film : ImageIcon
  const phaseLabel =
    phase === "compression"
      ? isVideo
        ? "Compression de la vidéo"
        : "Optimisation de l'image"
      : phase === "envoi"
        ? "Envoi"
        : phase === "couverture"
          ? "Couverture"
          : ""
  const percent = Math.round(progress * 100)

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-900">
        {label}
        {required && <span className="text-[#C8151B]"> *</span>}
      </label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}

      <div
        className={cn(
          "relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg border bg-zinc-50",
          error ? "border-red-400" : "border-zinc-200"
        )}
      >
        {value ? (
          isVideo ? (
            <video src={value} muted loop playsInline controls className="h-full w-full bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`Aperçu : ${label}`} className="h-full w-full object-cover" />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-zinc-500">
            <Icon className="h-6 w-6" aria-hidden="true" />
            Aucun fichier
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-700" aria-hidden="true" />
          </span>
        )}
      </div>

      <div aria-live="polite" className="max-w-md space-y-1">
        {busy && (
          <>
            <p className="text-xs font-medium text-zinc-700">
              {phaseLabel}
              {phase !== "couverture" && ` : ${percent} %`}
            </p>
            <div
              role="progressbar"
              aria-label={phaseLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 overflow-hidden rounded-full bg-zinc-200"
            >
              <div className="h-full bg-zinc-900 transition-[width] duration-200" style={{ width: `${percent}%` }} />
            </div>
          </>
        )}
        {result && !busy && <p className="text-xs font-medium text-emerald-700">{result}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()} className="min-h-[44px]">
          <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {value ? "Remplacer" : "Téléverser"}
        </Button>
        {busy && phase === "compression" && isVideo && (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()} className="min-h-[44px]">
            <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Annuler
          </Button>
        )}
        {value && !busy && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              onChange(null)
            }}
            className="min-h-[44px] border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Retirer
          </Button>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        {isVideo
          ? "MP4, MOV ou WebM de 60 s maximum : compressée automatiquement en MP4 1080p (15 Mo maximum). Pour une vidéo plus longue, utilisez un lien YouTube."
          : "JPG, PNG, WebP, GIF ou HEIC : image optimisée automatiquement avant l'envoi."}
      </p>
      {message && (
        <p role="alert" className="text-xs text-red-600">
          {message}
        </p>
      )}
      {warning && <p className="text-xs text-amber-700">{warning}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
