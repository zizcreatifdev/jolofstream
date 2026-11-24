import { z } from "zod"

import { extractYoutubeId } from "@/lib/portfolio"
import { hrefSchema, optionalHrefSchema, optionalMediaUrlSchema } from "@/lib/site-links"
import { UPLOAD_RULES, bucketStoragePath } from "@/lib/storage-buckets"

// Carrousel video du hero de l'accueil : regles partagees par l'admin, l'API
// et le site public (aucune dependance serveur, importable cote client).

export const MAX_HERO_SLIDES = 5

export const HERO_VIDEO_TYPES = ["YOUTUBE", "MP4", "NONE"] as const
export type HeroVideoTypeValue = (typeof HERO_VIDEO_TYPES)[number]

export const HERO_VIDEO_TYPE_LABELS: Record<HeroVideoTypeValue, string> = {
  YOUTUBE: "Lien YouTube",
  MP4: "Fichier video (MP4 ou WebM)",
  NONE: "Sans video (animation de scene)",
}

// Duree d'une slide (parametre hero_slide_duration, en secondes)
export const HERO_DURATION_DEFAULT = 10
export const HERO_DURATION_MIN = 5
export const HERO_DURATION_MAX = 30

export function parseSlideDuration(value: string | null | undefined): number {
  const n = Number.parseInt(String(value ?? ""), 10)
  if (!Number.isFinite(n)) return HERO_DURATION_DEFAULT
  return Math.min(HERO_DURATION_MAX, Math.max(HERO_DURATION_MIN, n))
}

// Medias televerses dans le bucket Supabase "hero" (regles communes)
export const HERO_MEDIA = UPLOAD_RULES.hero

export type HeroMediaKind = keyof typeof HERO_MEDIA

export const YOUTUBE_FORMATS_HINT =
  "Formats acceptes : youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/."

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caracteres maximum`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const heroSlideInputSchema = z
  .object({
    active: z.boolean().default(true),
    kicker: z.string().trim().min(1, "Surtitre requis").max(80, "80 caracteres maximum"),
    titleLine1: z.string().trim().min(1, "Ligne 1 requise").max(60, "60 caracteres maximum"),
    titleLine2: z.string().trim().min(1, "Ligne 2 requise").max(60, "60 caracteres maximum"),
    accentText: optionalText(60),
    description: z
      .string()
      .trim()
      .min(1, "Description requise")
      .max(320, "320 caracteres maximum"),
    videoType: z.enum(HERO_VIDEO_TYPES),
    youtubeUrl: optionalText(300),
    mp4Url: optionalMediaUrlSchema,
    posterUrl: optionalMediaUrlSchema,
    cta1Label: z.string().trim().min(1, "Libelle requis").max(40, "40 caracteres maximum"),
    cta1Href: hrefSchema,
    cta2Label: optionalText(40),
    cta2Href: optionalHrefSchema,
    soundLabel: z
      .string()
      .trim()
      .max(40, "40 caracteres maximum")
      .optional()
      .transform((v) => (v ? v : "Regarder avec le son")),
    badgeText: optionalText(80),
  })
  .superRefine((data, ctx) => {
    if (data.accentText && !data.titleLine2.includes(data.accentText)) {
      ctx.addIssue({
        code: "custom",
        path: ["accentText"],
        message: "Le texte accentue doit figurer tel quel dans la ligne 2.",
      })
    }
    if (data.videoType === "YOUTUBE") {
      if (!data.youtubeUrl || !extractYoutubeId(data.youtubeUrl)) {
        ctx.addIssue({
          code: "custom",
          path: ["youtubeUrl"],
          message: `Lien YouTube invalide. ${YOUTUBE_FORMATS_HINT}`,
        })
      }
    }
    if (data.videoType === "MP4") {
      if (!data.mp4Url) {
        ctx.addIssue({
          code: "custom",
          path: ["mp4Url"],
          message: "Televersez la video MP4 ou WebM.",
        })
      }
      if (!data.posterUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["posterUrl"],
          message: "L'image de couverture est obligatoire pour une video MP4.",
        })
      }
    }
    if (Boolean(data.cta2Label) !== Boolean(data.cta2Href)) {
      ctx.addIssue({
        code: "custom",
        path: [data.cta2Label ? "cta2Href" : "cta2Label"],
        message: "Le second bouton demande un libelle et un lien.",
      })
    }
  })

export type HeroSlideInput = z.input<typeof heroSlideInputSchema>
export type HeroSlideParsed = z.output<typeof heroSlideInputSchema>

// Donnees enregistrees : l'identifiant YouTube est extrait a l'enregistrement
// et les champs inutiles au type de video sont vides
export function toHeroSlideData(data: HeroSlideParsed) {
  const youtubeId =
    data.videoType === "YOUTUBE" && data.youtubeUrl
      ? extractYoutubeId(data.youtubeUrl)
      : null
  return {
    active: data.active,
    kicker: data.kicker,
    titleLine1: data.titleLine1,
    titleLine2: data.titleLine2,
    accentText: data.accentText,
    description: data.description,
    videoType: data.videoType,
    youtubeUrl: data.videoType === "YOUTUBE" ? data.youtubeUrl : null,
    youtubeId,
    mp4Url: data.videoType === "MP4" ? data.mp4Url : null,
    posterUrl: data.posterUrl,
    cta1Label: data.cta1Label,
    cta1Href: data.cta1Href,
    cta2Label: data.cta2Label,
    cta2Href: data.cta2Label ? (data.cta2Href ?? null) : null,
    soundLabel: data.soundLabel,
    badgeText: data.badgeText,
  }
}

// Forme envoyee au site public et a l'admin (dates en ISO)
export type HeroSlideView = {
  id: string
  order: number
  active: boolean
  kicker: string
  titleLine1: string
  titleLine2: string
  accentText: string | null
  description: string
  videoType: HeroVideoTypeValue
  youtubeUrl: string | null
  youtubeId: string | null
  mp4Url: string | null
  posterUrl: string | null
  cta1Label: string
  cta1Href: string
  cta2Label: string | null
  cta2Href: string | null
  soundLabel: string
  badgeText: string | null
}

export function toHeroSlideView(slide: HeroSlideView): HeroSlideView {
  return {
    id: slide.id,
    order: slide.order,
    active: slide.active,
    kicker: slide.kicker,
    titleLine1: slide.titleLine1,
    titleLine2: slide.titleLine2,
    accentText: slide.accentText,
    description: slide.description,
    videoType: slide.videoType,
    youtubeUrl: slide.youtubeUrl,
    youtubeId: slide.youtubeId,
    mp4Url: slide.mp4Url,
    posterUrl: slide.posterUrl,
    cta1Label: slide.cta1Label,
    cta1Href: slide.cta1Href,
    cta2Label: slide.cta2Label,
    cta2Href: slide.cta2Href,
    soundLabel: slide.soundLabel,
    badgeText: slide.badgeText,
  }
}

// Une slide a une video de fond lisible
export function slideHasVideo(slide: HeroSlideView): boolean {
  if (slide.videoType === "YOUTUBE") return Boolean(slide.youtubeId)
  if (slide.videoType === "MP4") return Boolean(slide.mp4Url)
  return false
}

export function youtubeThumbnailUrl(
  id: string,
  quality: "maxres" | "hq" = "maxres"
): string {
  return `https://i.ytimg.com/vi/${id}/${quality === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`
}

// Image affichee immediatement : couverture televersee, sinon miniature YouTube
export function slidePosterUrl(slide: HeroSlideView): string | null {
  if (slide.posterUrl) return slide.posterUrl
  if (slide.videoType === "YOUTUBE" && slide.youtubeId) {
    return youtubeThumbnailUrl(slide.youtubeId)
  }
  return null
}

// Ligne 2 decoupee autour du texte accentue (italique jaune)
export function splitAccent(
  line: string,
  accent: string | null
): { before: string; accent: string; after: string } {
  if (!accent) return { before: line, accent: "", after: "" }
  const index = line.indexOf(accent)
  if (index === -1) return { before: line, accent: "", after: "" }
  return {
    before: line.slice(0, index),
    accent,
    after: line.slice(index + accent.length),
  }
}

// Badge "Libelle | Texte" : le libelle s'affiche dans la pastille rouge
export function parseBadge(
  badge: string | null
): { label: string; text: string } | null {
  if (!badge) return null
  const [label, ...rest] = badge.split("|")
  const text = rest.join("|").trim()
  return text ? { label: label.trim(), text } : { label: badge.trim(), text: "" }
}

// Libelle court de l'onglet : debut du surtitre, avant le premier point median
export function slideTabLabel(slide: Pick<HeroSlideView, "kicker">): string {
  return slide.kicker.split("·")[0].trim() || slide.kicker
}

// Video de fond : muette, en boucle, sans interface (parametres imposes)
export function youtubeBackgroundSrc(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`
}

export function youtubePlayerSrc(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
}

// Bucket Supabase Storage public des medias du hero
export const HERO_BUCKET = "hero"

// Chemin d'un fichier du bucket hero depuis son URL publique (null sinon)
export function heroStoragePath(url: string): string | null {
  return bucketStoragePath(HERO_BUCKET, url)
}
