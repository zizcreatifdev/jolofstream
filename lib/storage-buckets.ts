// Buckets Supabase Storage publics alimentes depuis l'admin et regles de
// chaque type de fichier (partage client, API d'upload signe et nettoyage).

const LEGACY_IMAGE = {
  types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  extensions: ".jpg,.jpeg,.png,.webp,.gif",
  maxBytes: 5 * 1024 * 1024,
  label: "JPG, PNG, WebP ou GIF, 5 Mo maximum",
} as const

const GALLERY_IMAGE = {
  types: ["image/jpeg", "image/webp"],
  extensions: ".jpg,.jpeg,.webp",
  maxBytes: 3 * 1024 * 1024,
  label: "JPG ou WebP, 3 Mo maximum",
} as const

export const UPLOAD_RULES = {
  hero: {
    video: {
      types: ["video/mp4", "video/webm"],
      extensions: ".mp4,.webm",
      maxBytes: 15 * 1024 * 1024,
      label: "MP4 ou WebM, 15 Mo maximum",
    },
    poster: {
      types: ["image/jpeg", "image/webp"],
      extensions: ".jpg,.jpeg,.webp",
      maxBytes: 1024 * 1024,
      label: "JPG ou WebP, 1 Mo maximum",
    },
    // Images d'en-tête des pages publiques (redimensionnées à l'envoi)
    header: {
      types: ["image/jpeg", "image/webp"],
      extensions: ".jpg,.jpeg,.webp",
      maxBytes: 1024 * 1024,
      label: "JPG ou WebP, 1 Mo maximum",
    },
  },
  site: {
    image: {
      types: ["image/jpeg", "image/webp"],
      extensions: ".jpg,.jpeg,.webp",
      maxBytes: 500 * 1024,
      label: "JPG ou WebP, 500 Ko maximum",
    },
  },
  // Plaquettes PDF des programmes de formation
  formations: {
    brochure: {
      types: ["application/pdf"],
      extensions: ".pdf",
      maxBytes: 10 * 1024 * 1024,
      label: "PDF, 10 Mo maximum",
    },
  },
  // Galerie photos : grande taille et miniature produites dans le navigateur
  galerie: { photo: GALLERY_IMAGE, thumb: GALLERY_IMAGE },
  // Images de l'admin V1 (signature, équipe, avatars, portfolio)
  avatars: { image: LEGACY_IMAGE },
  signatures: { image: LEGACY_IMAGE },
  equipe: { image: LEGACY_IMAGE },
  portfolio: { image: LEGACY_IMAGE },
} as const

export type UploadBucket = keyof typeof UPLOAD_RULES
export type UploadKind<B extends UploadBucket> = keyof (typeof UPLOAD_RULES)[B]
export type UploadTarget =
  | { bucket: "hero"; kind: UploadKind<"hero"> }
  | { bucket: "site"; kind: UploadKind<"site"> }
  | { bucket: "formations"; kind: UploadKind<"formations"> }
  | { bucket: "galerie"; kind: UploadKind<"galerie"> }
  | { bucket: "avatars" | "signatures" | "equipe" | "portfolio"; kind: "image" }

export type UploadRule = {
  types: readonly string[]
  extensions: string
  maxBytes: number
  label: string
}

export const UPLOAD_BUCKETS = Object.keys(UPLOAD_RULES) as UploadBucket[]

export function uploadRule(target: UploadTarget): UploadRule {
  const rules = UPLOAD_RULES[target.bucket] as Record<string, UploadRule>
  return rules[target.kind as string]
}

// Taille limite et types acceptes au niveau du bucket (creation)
export function bucketLimits(bucket: UploadBucket): {
  fileSizeLimit: number
  allowedMimeTypes: string[]
} {
  const rules = Object.values(UPLOAD_RULES[bucket]) as UploadRule[]
  return {
    fileSizeLimit: Math.max(...rules.map((r) => r.maxBytes)),
    allowedMimeTypes: Array.from(new Set(rules.flatMap((r) => [...r.types]))),
  }
}

// Chemin d'un fichier depuis son URL publique Supabase (null hors du bucket)
export function bucketStoragePath(bucket: UploadBucket, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0])
}
