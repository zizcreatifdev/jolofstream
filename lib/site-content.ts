import { z } from "zod"

import { hrefSchema, optionalMediaUrlSchema } from "@/lib/site-links"

// Contenus administrables de l'accueil et de la page Services, stockes en
// JSON dans la table Setting et valides par Zod (admin, API et site public).
// Aucune valeur par defaut ici : le contenu initial vient du seed.

const required = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} requis`)
    .max(max, `${max} caractères maximum`)

const optional = (max: number) =>
  z.string().trim().max(max, `${max} caractères maximum`).default("")

export const SERVICE_KEYS = ["live", "ceo", "creator", "social"] as const
export type ServiceKey = (typeof SERVICE_KEYS)[number]

// Correspondances d'un chapitre de /services : ancre (pied de page, D-167),
// type d'offre du catalogue, valeur du formulaire de contact (D-109)
export const SERVICE_META: Record<
  ServiceKey,
  { anchor: string; offerType: string; contactValue: string; label: string }
> = {
  live: {
    anchor: "captation-streaming-live",
    offerType: "live",
    contactValue: "captation-streaming-live",
    label: "Captation et streaming",
  },
  ceo: {
    anchor: "ceo-content-package",
    offerType: "ceo_content",
    contactValue: "ceo-content-package",
    label: "CEO Content",
  },
  creator: {
    anchor: "creator-weekend",
    offerType: "creator_weekend",
    contactValue: "creator-weekend",
    label: "Creator Weekend",
  },
  social: {
    anchor: "gestion-reseaux",
    offerType: "social",
    contactValue: "gestion-reseaux",
    label: "Publication réseaux",
  },
}

export const homeManifestoSchema = z.object({
  kicker: optional(60),
  text: optional(320),
})

export const MAX_SKILLS = 8

export const homeSkillsSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  items: z
    .array(
      z.object({
        title: required(80, "Titre"),
        description: required(220, "Description"),
        imageUrl: optionalMediaUrlSchema,
      })
    )
    .max(MAX_SKILLS, `${MAX_SKILLS} savoir-faire maximum`),
})

export const homeFinalCtaSchema = z.object({
  marquee: required(60, "Bandeau"),
  text: required(240, "Texte"),
  cta1Label: required(40, "Libellé du bouton"),
  cta1Href: hrefSchema,
})

// Titres des sections de l'accueil qui n'ont pas de bloc dedie
export const homeSectionsSchema = z.object({
  worksKicker: optional(60),
  worksTitle: required(80, "Titre"),
  worksTitleAccent: optional(80),
  worksText: optional(200),
  offersKicker: optional(60),
  offersTitle: required(80, "Titre"),
  offersTitleAccent: optional(80),
  formationsTitle: required(80, "Titre"),
  formationsText: optional(320),
  testimonialsKicker: optional(60),
  testimonialsTitle: required(80, "Titre"),
  testimonialsTitleAccent: optional(80),
})

export const MAX_INCLUDED = 10
export const MAX_STEPS = 6

const serviceSchema = z.object({
  kicker: optional(60),
  title: required(60, "Titre"),
  titleAccent: optional(60),
  intro: required(600, "Introduction"),
  included: z
    .array(required(100, "Élément"))
    .max(MAX_INCLUDED, `${MAX_INCLUDED} éléments maximum`),
  steps: z
    .array(
      z.object({
        title: required(60, "Titre"),
        description: required(200, "Description"),
      })
    )
    .max(MAX_STEPS, `${MAX_STEPS} étapes maximum`),
})

export const servicesContentSchema = z.object({
  live: serviceSchema,
  ceo: serviceSchema,
  creator: serviceSchema,
  social: serviceSchema,
})

// En-tete et appel final de la page Services
export const servicesPageSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  lead: optional(320),
  finalMarquee: required(60, "Bandeau"),
  finalText: required(240, "Texte"),
})

export const SITE_CONTENT_SCHEMAS = {
  home_manifesto: homeManifestoSchema,
  home_skills: homeSkillsSchema,
  home_final_cta: homeFinalCtaSchema,
  home_sections: homeSectionsSchema,
  services_content: servicesContentSchema,
  services_page: servicesPageSchema,
} as const

export type SiteContentKey = keyof typeof SITE_CONTENT_SCHEMAS
export const SITE_CONTENT_KEYS = Object.keys(SITE_CONTENT_SCHEMAS) as SiteContentKey[]

export type HomeManifesto = z.output<typeof homeManifestoSchema>
export type HomeSkills = z.output<typeof homeSkillsSchema>
export type HomeFinalCta = z.output<typeof homeFinalCtaSchema>
export type HomeSections = z.output<typeof homeSectionsSchema>
export type ServiceContent = z.output<typeof serviceSchema>
export type ServicesContent = z.output<typeof servicesContentSchema>
export type ServicesPage = z.output<typeof servicesPageSchema>

export type SiteContentMap = {
  home_manifesto: HomeManifesto
  home_skills: HomeSkills
  home_final_cta: HomeFinalCta
  home_sections: HomeSections
  services_content: ServicesContent
  services_page: ServicesPage
}

// Lecture tolerante : JSON invalide ou non conforme donne null (section masquee)
export function parseSiteContent<K extends SiteContentKey>(
  key: K,
  raw: string | null | undefined
): SiteContentMap[K] | null {
  if (!raw) return null
  try {
    const result = SITE_CONTENT_SCHEMAS[key].safeParse(JSON.parse(raw))
    return result.success ? (result.data as SiteContentMap[K]) : null
  } catch {
    return null
  }
}

// Pages a regenerer apres l'enregistrement d'un contenu
export const SITE_CONTENT_PATHS: Record<SiteContentKey, string[]> = {
  home_manifesto: ["/"],
  home_skills: ["/"],
  home_final_cta: ["/"],
  home_sections: ["/"],
  services_content: ["/", "/services"],
  services_page: ["/services"],
}

// Syntaxe de mise en avant : *mots* en italique, **mots** en rouge
export type EmphasisStyle = "plain" | "em" | "strong"
export type EmphasisSegment = { text: string; style: EmphasisStyle }

export function parseEmphasis(text: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = []
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), style: "plain" })
    }
    segments.push(
      match[1] !== undefined
        ? { text: match[1], style: "strong" }
        : { text: match[2], style: "em" }
    )
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last), style: "plain" })
  return segments
}

// Mots individuels avec leur style (eclairage mot par mot du manifeste)
export function emphasisWords(text: string): EmphasisSegment[] {
  return parseEmphasis(text).flatMap((segment) =>
    segment.text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ text: word, style: segment.style }))
  )
}
