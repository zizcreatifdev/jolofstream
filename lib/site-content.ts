import { z } from "zod"

import { hrefSchema, optionalMediaUrlSchema } from "@/lib/site-links"

// Contenus administrables de l'accueil et de la page Services, stockes en
// JSON dans la table Setting et valides par Zod (admin, API et site public).
// Contenu initial par le seed, sauf formations_page (FORMATIONS_PAGE_DEFAULT,
// utilise tant que la cle n'existe pas en base).

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
    contactValue: "evenement-live",
    label: "Captation et streaming",
  },
  ceo: {
    anchor: "ceo-content-package",
    offerType: "ceo_content",
    contactValue: "ceo-content",
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
    contactValue: "autre",
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

// Page /formations : en-tete, titres des sections, bloc entreprise et
// deroule de la reservation. {delai} est remplace par le delai de paiement
// (Parametres > Formations), par exemple « 48h » ou « 3 jours ».
export const MAX_FLOW_STEPS = 6
export const DELAY_TOKEN = "{delai}"

export const formationsPageSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  lead: optional(400),
  listKicker: optional(60),
  listTitle: required(80, "Titre"),
  listTitleAccent: optional(80),
  listLead: optional(320),
  alumniKicker: optional(60),
  alumniTitle: required(80, "Titre"),
  alumniTitleAccent: optional(80),
  soonKicker: optional(60),
  soonTitle: required(120, "Titre"),
  soonCta: required(40, "Bouton"),
  flowKicker: optional(60),
  flowTitle: required(80, "Titre"),
  flowTitleAccent: optional(80),
  steps: z
    .array(
      z.object({
        title: required(60, "Titre"),
        text: required(240, "Texte"),
      })
    )
    .min(1, "Au moins une étape")
    .max(MAX_FLOW_STEPS, `${MAX_FLOW_STEPS} étapes maximum`),
})

export type FormationsPage = z.output<typeof formationsPageSchema>

// Contenu initial de la page /formations (textes de la maquette). Utilise
// tant que la cle formations_page n'existe pas en base : elle est creee au
// premier enregistrement depuis l'admin (aucun SQL).
export const FORMATIONS_PAGE_DEFAULT: FormationsPage = {
  kicker: "Scène 03 · Formations",
  title: "Passez derrière",
  titleAccent: "la caméra.",
  lead: "Cinq séances en petit groupe, sur du matériel professionnel : la théorie pour comprendre, la pratique pour décider en régie. Vous repartez en ayant réalisé un vrai direct.",
  listKicker: "Nos formations",
  listTitle: "Choisissez",
  listTitleAccent: "votre cohorte.",
  listLead: "Chaque formation ouvre plusieurs cohortes dans l’année. Les places restantes sont mises à jour à chaque réservation.",
  alumniKicker: "Parcours d’anciens",
  alumniTitle: "Ils sont passés",
  alumniTitleAccent: "par la régie.",
  soonKicker: "Bientôt",
  soonTitle: "Formation sur mesure entreprise",
  soonCta: "Être prévenu",
  flowKicker: "Inscription",
  flowTitle: "Simple,",
  flowTitleAccent: "sans paiement en ligne.",
  steps: [
    {
      title: "Vous vous inscrivez",
      text: "Vous choisissez votre formation et votre cohorte, puis vous remplissez vos informations.",
    },
    {
      title: "Vous recevez un email",
      text: "Vous recevez par email le lien de paiement Wave Business. Sans paiement sous {delai}, la place peut être libérée.",
    },
    { title: "Vous payez avec Wave", text: "Depuis votre téléphone, en quelques secondes." },
    {
      title: "Place confirmée",
      text: "Nous validons le paiement et vous envoyons les infos pratiques.",
    },
  ],
}

export function withDelay(text: string, delayLabel: string): string {
  return text.split(DELAY_TOKEN).join(delayLabel)
}

// Page /contact : en-tete, zone d'intervention, ecran de succes de l'assistant
// (successTitle accepte la syntaxe *accent*)
export const contactPageSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  lead: optional(320),
  zoneText: optional(320),
  successTitle: required(80, "Titre de succès"),
  successText: required(320, "Texte de succès"),
})

// Page /portfolio : en-tete et bandeau final (*accent* dans le bandeau)
export const portfolioPageSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  lead: optional(320),
  finalMarquee: required(60, "Bandeau"),
  finalText: optional(240),
  finalCtaLabel: required(40, "Bouton"),
})

// Page /a-propos : en-tete (histoire, mission, valeurs, equipe et chiffres
// restent dans les parametres about_*)
export const aboutPageSchema = z.object({
  kicker: optional(60),
  title: required(80, "Titre"),
  titleAccent: optional(80),
  lead: optional(600),
})

export const MAX_FAQ = 12

// Questions frequentes de /contact (JSON-LD FAQPage)
export const faqItemsSchema = z
  .array(
    z.object({
      question: required(200, "Question"),
      answer: required(1200, "Réponse"),
    })
  )
  .max(MAX_FAQ, `${MAX_FAQ} questions maximum`)

export type ContactPage = z.output<typeof contactPageSchema>
export type PortfolioPage = z.output<typeof portfolioPageSchema>
export type AboutPage = z.output<typeof aboutPageSchema>
export type FaqItems = z.output<typeof faqItemsSchema>

export const SITE_CONTENT_SCHEMAS = {
  home_manifesto: homeManifestoSchema,
  home_skills: homeSkillsSchema,
  home_final_cta: homeFinalCtaSchema,
  home_sections: homeSectionsSchema,
  services_content: servicesContentSchema,
  services_page: servicesPageSchema,
  formations_page: formationsPageSchema,
  contact_page: contactPageSchema,
  portfolio_page: portfolioPageSchema,
  about_page: aboutPageSchema,
  faq_items: faqItemsSchema,
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
  formations_page: FormationsPage
  contact_page: ContactPage
  portfolio_page: PortfolioPage
  about_page: AboutPage
  faq_items: FaqItems
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
  formations_page: ["/formations"],
  contact_page: ["/contact"],
  portfolio_page: ["/portfolio"],
  about_page: ["/a-propos"],
  faq_items: ["/contact"],
}

// Syntaxe de mise en avant : module leger lib/emphasis.ts (sans Zod), pour
// ne pas charger les schemas dans le JavaScript des pages publiques
export { emphasisWords, parseEmphasis, type EmphasisSegment, type EmphasisStyle } from "@/lib/emphasis"
