"use client"

// Redimensionnement des photos dans le navigateur avant l'envoi (galerie,
// images d'en-tête). Le décodage applique l'orientation EXIF, puis le
// réencodage par canvas produit un fichier sans métadonnées (GPS compris).

export const HEIC_MESSAGE = "Format HEIC non lu par ce navigateur : exportez la photo en JPG"
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

export type ResizedImage = { blob: Blob; width: number; height: number; type: "image/webp" | "image/jpeg" }

type Source = { draw: CanvasImageSource; width: number; height: number; close: () => void }

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name)
}

async function decodeWithImageElement(file: File): Promise<Source> {
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

async function decode(file: File): Promise<Source> {
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function encode(
  source: Source,
  maxSide: number,
  quality: number,
  maxBytes: number
): Promise<ResizedImage> {
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

  // WebP, repli JPEG si le navigateur ne l'encode pas ; qualité réduite par
  // paliers si le fichier dépasse la limite
  let q = quality
  for (let attempt = 0; attempt < 5; attempt++) {
    let blob = await canvasToBlob(canvas, "image/webp", q)
    let type: ResizedImage["type"] = "image/webp"
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", q)
      type = "image/jpeg"
    }
    if (!blob) throw new Error("Encodage de l'image impossible.")
    if (blob.size <= maxBytes || q <= 0.5) {
      canvas.width = 0
      canvas.height = 0
      return { blob, width, height, type }
    }
    q = Math.max(0.5, q - 0.08)
  }
  throw new Error("Image trop lourde après compression.")
}

// Grande taille (2 400 px, WebP 0,82, 1 Mo) et miniature (800 px, WebP 0,78)
export async function prepareGalleryPhoto(file: File): Promise<{ large: ResizedImage; thumb: ResizedImage }> {
  if (!isAcceptedImage(file)) throw new Error("Format non accepté : JPG, PNG ou WebP.")
  const source = await decode(file)
  try {
    const large = await encode(source, 2400, 0.82, 1024 * 1024)
    const thumb = await encode(source, 800, 0.78, 250 * 1024)
    return { large, thumb }
  } finally {
    source.close()
  }
}

// Image d'en-tête de page : grande taille seulement (2 400 px, 1 Mo)
export async function prepareHeaderImage(file: File): Promise<ResizedImage> {
  if (!isAcceptedImage(file)) throw new Error("Format non accepté : JPG, PNG ou WebP.")
  const source = await decode(file)
  try {
    return await encode(source, 2400, 0.82, 1024 * 1024)
  } finally {
    source.close()
  }
}

export function extensionFor(type: ResizedImage["type"]): string {
  return type === "image/webp" ? "webp" : "jpg"
}
