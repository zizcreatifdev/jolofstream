"use client"

import {
  IMAGE_PROFILES,
  MAX_INPUT_BYTES,
  MAX_INPUT_PIXELS,
  MAX_SCALE_PASSES,
  QUALITY_STEPS,
  SCALE_STEP,
  type ImageProfileName,
} from "@/lib/image-profiles"

// Compression des images dans le navigateur avant l'envoi : une seule chaîne
// pour tout l'admin (profils de lib/image-profiles.ts) et la galerie. Le
// décodage applique l'orientation EXIF, puis le réencodage par canvas produit
// un fichier sans métadonnées (GPS compris).

export const HEIC_MESSAGE = "Format HEIC non lu par ce navigateur : exportez la photo en JPG"
export const ANIMATED_GIF_MESSAGE = "GIF animé non pris en charge : exportez une image fixe (JPG ou PNG)"
export const TOO_BIG_MESSAGE = "Fichier trop lourd : 40 Mo maximum avant optimisation."
export const TOO_MANY_PIXELS_MESSAGE = "Image trop grande : 60 mégapixels maximum avant optimisation."
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/jpeg,image/png,image/webp,image/gif,image/heic"

export type OutputType = "image/webp" | "image/jpeg" | "image/png"
export type ResizedImage = { blob: Blob; width: number; height: number; type: OutputType }
export type CompressedImage = ResizedImage & { originalSize: number }

type Source = { draw: CanvasImageSource; width: number; height: number; close: () => void }

function isHeic(file: Blob): boolean {
  const name = file instanceof File ? file.name : ""
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(name)
}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp|gif|hei[cf])$/i.test(file.name)
}

// GIF animé : plus d'une extension de contrôle graphique (une par image)
async function isAnimatedGif(file: Blob): Promise<boolean> {
  if (!/gif/i.test(file.type) && !(file instanceof File && /\.gif$/i.test(file.name))) return false
  const bytes = new Uint8Array(await file.arrayBuffer())
  let frames = 0
  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
      frames++
      if (frames > 1) return true
    }
  }
  return false
}

async function decodeWithImageElement(file: Blob): Promise<Source> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    img.src = url
    await img.decode()
    // L'élément <img> applique l'orientation EXIF (image-orientation: from-image)
    return { draw: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

async function decode(file: Blob): Promise<Source> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      return { draw: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    }
  } catch {
    // createImageBitmap absent ou sans l'option : repli sur <img>
  }
  try {
    return await decodeWithImageElement(file)
  } catch {
    throw new Error(isHeic(file) ? HEIC_MESSAGE : "Image illisible : fichier corrompu ou format non pris en charge.")
  }
}

// Contrôles du fichier d'entrée (poids, format, GIF animé), puis décodage
// et contrôle du nombre de pixels
async function checkedDecode(file: Blob): Promise<Source> {
  if (file.size > MAX_INPUT_BYTES) throw new Error(TOO_BIG_MESSAGE)
  if (file instanceof File && !isAcceptedImage(file)) throw new Error("Format non accepté : JPG, PNG, WebP, GIF ou HEIC.")
  if (await isAnimatedGif(file)) throw new Error(ANIMATED_GIF_MESSAGE)
  const source = await decode(file)
  if (source.width * source.height > MAX_INPUT_PIXELS) {
    source.close()
    throw new Error(TOO_MANY_PIXELS_MESSAGE)
  }
  return source
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function draw(source: Source, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Traitement de l'image impossible dans ce navigateur.")
  context.imageSmoothingQuality = "high"
  context.drawImage(source.draw, 0, 0, width, height)
  return { canvas, width, height }
}

async function toBlob(canvas: HTMLCanvasElement, format: "webp" | "png" | "jpeg", quality: number): Promise<{ blob: Blob; type: OutputType }> {
  if (format === "jpeg") {
    const jpeg = await canvasToBlob(canvas, "image/jpeg", quality)
    if (!jpeg) throw new Error("Encodage de l'image impossible.")
    return { blob: jpeg, type: "image/jpeg" }
  }
  if (format === "png") {
    const blob = await canvasToBlob(canvas, "image/png", 1)
    if (!blob) throw new Error("Encodage de l'image impossible.")
    return { blob, type: "image/png" }
  }
  // WebP, repli JPEG si le navigateur ne l'encode pas
  const webp = await canvasToBlob(canvas, "image/webp", quality)
  if (webp && webp.type === "image/webp") return { blob: webp, type: "image/webp" }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", quality)
  if (!jpeg) throw new Error("Encodage de l'image impossible.")
  return { blob: jpeg, type: "image/jpeg" }
}

// Encodage selon le profil : qualité 0,82, 0,74, 0,66, puis dimensions
// réduites de 15 % à chaque passe. Premier résultat sous la cible (le
// meilleur, car les essais vont du plus fin au plus réduit) ; à défaut, le
// plus léger s'il reste sous la limite du bucket.
async function encodeProfile(source: Source, name: ImageProfileName, forceJpeg = false): Promise<ResizedImage> {
  const profile = IMAGE_PROFILES[name]
  const format = forceJpeg && profile.format === "webp" ? "jpeg" : profile.format
  const qualities = format === "png" ? [1] : QUALITY_STEPS
  let smallest: ResizedImage | null = null
  let maxSide = Math.min(profile.maxSide, Math.max(source.width, source.height))
  for (let pass = 0; pass < MAX_SCALE_PASSES; pass++) {
    const { canvas, width, height } = draw(source, maxSide)
    try {
      for (const q of qualities) {
        const { blob, type } = await toBlob(canvas, format, q)
        const result = { blob, width, height, type }
        if (blob.size <= profile.targetBytes) return result
        if (!smallest || blob.size < smallest.blob.size) smallest = result
      }
    } finally {
      canvas.width = 0
      canvas.height = 0
    }
    maxSide = Math.round(maxSide * SCALE_STEP)
    if (maxSide < 160) break
  }
  if (smallest && smallest.blob.size <= profile.limitBytes) return smallest
  throw new Error("Compression impossible sous la limite autorisée : essayez une autre image.")
}

// Compression d'une image selon un profil nommé (admin). forceJpeg : repli
// pour un bucket qui refuserait le WebP.
export async function compressImage(file: Blob, name: ImageProfileName, options: { forceJpeg?: boolean } = {}): Promise<CompressedImage> {
  const source = await checkedDecode(file)
  try {
    const result = await encodeProfile(source, name, options.forceJpeg)
    return { ...result, originalSize: file.size }
  } finally {
    source.close()
  }
}

// Galerie (prompt 7, inchangé) : grande taille 2 400 px, WebP 0,82, 1 Mo, et
// miniature 800 px, WebP 0,78, 250 Ko
async function encodeGallery(source: Source, maxSide: number, quality: number, maxBytes: number): Promise<ResizedImage> {
  const { canvas, width, height } = draw(source, maxSide)
  try {
    let q = quality
    for (let attempt = 0; attempt < 5; attempt++) {
      const { blob, type } = await toBlob(canvas, "webp", q)
      // Plancher 0,5 : arrondi pour éviter l'erreur de flottant (0,82 - 4 x 0,08)
      if (blob.size <= maxBytes || q <= 0.5) return { blob, width, height, type }
      q = Math.max(0.5, Math.round((q - 0.08) * 100) / 100)
    }
    throw new Error("Image trop lourde après compression.")
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

export async function prepareGalleryPhoto(file: File): Promise<{ large: ResizedImage; thumb: ResizedImage }> {
  const source = await checkedDecode(file)
  try {
    const large = await encodeGallery(source, 2400, 0.82, 1024 * 1024)
    const thumb = await encodeGallery(source, 800, 0.78, 250 * 1024)
    return { large, thumb }
  } finally {
    source.close()
  }
}

export function extensionFor(type: OutputType): string {
  return type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg"
}
