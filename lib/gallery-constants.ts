// Constantes de la galerie, sans Zod : partagées par le site public (léger),
// l'admin et l'API

export const GALLERY_CATEGORIES = {
  evenements: "Événements",
  formations: "Formations",
  coulisses: "Coulisses",
} as const
export type GalleryCategory = keyof typeof GALLERY_CATEGORIES
export const GALLERY_CATEGORY_KEYS = Object.keys(GALLERY_CATEGORIES) as GalleryCategory[]

export function isGalleryCategory(value: string | null | undefined): value is GalleryCategory {
  return Boolean(value) && Object.hasOwn(GALLERY_CATEGORIES, value as string)
}

export const MAX_PHOTOS_PER_ALBUM = 200
export const MAX_PHOTOS_PER_UPLOAD = 50
export const GALLERY_BUCKET = "galerie" as const
export const GALLERY_PATHS = ["/", "/galerie"]

// Texte alternatif par défaut : « Titre de l'album, photo N »
export function photoAlt(albumTitle: string, alt: string | null | undefined, index: number): string {
  return alt?.trim() || `${albumTitle}, photo ${index + 1}`
}


const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dakar" })

// Date d'un album en toutes lettres (heure de Dakar)
export function albumDateLabel(iso: string | null): string | null {
  return iso ? DATE.format(new Date(iso)) : null
}
