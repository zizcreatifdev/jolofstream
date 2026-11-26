// Profils de compression des images envoyées depuis l'admin (prompt 8).
// Module sans dépendance, partagé par la compression navigateur
// (lib/image-resize.ts) et le rattrapage serveur (sharp).

export type ImageFormat = "webp" | "png"

export type ImageProfile = {
  // Côté le plus long, en pixels (jamais d'agrandissement)
  maxSide: number
  format: ImageFormat
  // Qualité de départ (WebP), puis paliers 0,74 et 0,66
  quality: number
  // Poids visé : au-delà, qualité puis dimensions réduites par paliers
  targetBytes: number
  // Limite du bucket (protection finale côté serveur)
  limitBytes: number
  label: string
}

const KO = 1024
const MO = 1024 * 1024

export const IMAGE_PROFILES = {
  // En-têtes de pages (bucket hero, 1 Mo)
  "page-hero": { maxSide: 2400, format: "webp", quality: 0.82, targetBytes: 900 * KO, limitBytes: MO, label: "En-tête de page" },
  // Couverture d'une slide du hero (bucket hero, 1 Mo)
  "hero-poster": { maxSide: 2400, format: "webp", quality: 0.82, targetBytes: 900 * KO, limitBytes: MO, label: "Couverture du hero" },
  // Images du savoir-faire (bucket site, 500 Ko)
  skill: { maxSide: 1600, format: "webp", quality: 0.82, targetBytes: 450 * KO, limitBytes: 500 * KO, label: "Savoir-faire" },
  // Photos de témoignages (bucket site) et de l'équipe (bucket equipe)
  portrait: { maxSide: 800, format: "webp", quality: 0.82, targetBytes: 250 * KO, limitBytes: 500 * KO, label: "Portrait" },
  // Image principale de la page À propos (bucket equipe)
  wide: { maxSide: 2000, format: "webp", quality: 0.82, targetBytes: 700 * KO, limitBytes: 5 * MO, label: "Image À propos" },
  // Photos de profil des admins (bucket avatars)
  avatar: { maxSide: 400, format: "webp", quality: 0.82, targetBytes: 120 * KO, limitBytes: 5 * MO, label: "Avatar" },
  // Portfolio : photo de la réalisation et miniature personnalisée
  "portfolio-large": { maxSide: 2000, format: "webp", quality: 0.82, targetBytes: 900 * KO, limitBytes: 5 * MO, label: "Photo du portfolio" },
  "portfolio-thumb": { maxSide: 800, format: "webp", quality: 0.82, targetBytes: 250 * KO, limitBytes: 5 * MO, label: "Miniature du portfolio" },
  // Signature et tampon : repris dans les PDF (contrat), qui ne lisent pas
  // le WebP ; PNG pour garder la transparence
  signature: { maxSide: 1200, format: "png", quality: 1, targetBytes: 500 * KO, limitBytes: 5 * MO, label: "Signature" },
} as const satisfies Record<string, ImageProfile>

export type ImageProfileName = keyof typeof IMAGE_PROFILES

export const QUALITY_STEPS = [0.82, 0.74, 0.66]
export const SCALE_STEP = 0.85
export const MAX_SCALE_PASSES = 10

// Garde-fous du fichier d'entrée
export const MAX_INPUT_BYTES = 40 * MO
export const MAX_INPUT_PIXELS = 60_000_000

// « 6,2 Mo » ou « 412 Ko »
export function formatBytes(bytes: number): string {
  if (bytes >= MO) return `${(bytes / MO).toFixed(1).replace(".", ",")} Mo`
  return `${Math.max(1, Math.round(bytes / KO))} Ko`
}

export function optimizedMessage(kind: "Image" | "Vidéo", before: number, after: number): string {
  return `${kind} optimisée : ${formatBytes(before)} vers ${formatBytes(after)}`
}
