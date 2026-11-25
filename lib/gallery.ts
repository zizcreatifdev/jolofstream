import { z } from "zod"

import { bucketStoragePath } from "@/lib/storage-buckets"

// Galerie photos par albums : schémas Zod (admin et API). Constantes sans
// Zod dans lib/gallery-constants.ts (utilisables par le site public).

export {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_KEYS,
  GALLERY_BUCKET,
  GALLERY_PATHS,
  MAX_PHOTOS_PER_ALBUM,
  MAX_PHOTOS_PER_UPLOAD,
  isGalleryCategory,
  photoAlt,
  type GalleryCategory,
} from "@/lib/gallery-constants"
import { GALLERY_BUCKET, GALLERY_CATEGORY_KEYS, MAX_PHOTOS_PER_ALBUM, MAX_PHOTOS_PER_UPLOAD, type GalleryCategory } from "@/lib/gallery-constants"

export function gallerySlugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
  return slug || "album"
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .nullish()
    .transform((v) => (v ? v : null))

export const albumInputSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(120, "120 caractères maximum"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug requis")
    .max(80, "80 caractères maximum")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets uniquement"),
  description: optionalText(600),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .nullish()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  category: z.enum(GALLERY_CATEGORY_KEYS as [GalleryCategory, ...GalleryCategory[]], {
    message: "Catégorie requise",
  }),
  programId: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
})

export const albumPatchSchema = albumInputSchema.partial().extend({
  published: z.boolean().optional(),
  coverPhotoId: z.string().trim().min(1).nullable().optional(),
})

// Photo enregistrée après l'envoi direct vers le bucket galerie
export const photoInputSchema = z
  .object({
    url: z.string().trim().url(),
    path: z.string().trim().min(1).max(300),
    thumbUrl: z.string().trim().url(),
    thumbPath: z.string().trim().min(1).max(300),
    width: z.number().int().min(1).max(10000),
    height: z.number().int().min(1).max(10000),
  })
  .refine((p) => bucketStoragePath(GALLERY_BUCKET, p.url) === p.path && bucketStoragePath(GALLERY_BUCKET, p.thumbUrl) === p.thumbPath, {
    message: "Fichier hors du bucket galerie",
  })

export const photosInputSchema = z.object({
  photos: z
    .array(photoInputSchema)
    .min(1, "Aucune photo")
    .max(MAX_PHOTOS_PER_UPLOAD, `${MAX_PHOTOS_PER_UPLOAD} photos maximum par envoi`),
})

// Champs absents : inchangés ; chaîne vide : effacée
const patchText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null))

export const photoPatchSchema = z.object({
  alt: patchText(200),
  caption: patchText(200),
})

export const idsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "Aucun élément").max(MAX_PHOTOS_PER_ALBUM),
})
