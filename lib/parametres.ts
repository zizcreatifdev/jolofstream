import { CGV_TEMPLATE_V2, MENTIONS_TEMPLATE_V2 } from "./legal-templates"

// Textes de la page A propos (anciens textes de secours du code, accents
// corriges) : seed et migration 20261127120000_v2_p5, jamais affiches en dur
export const ABOUT_HISTORY_DEFAULT =
  "Jolof Stream est née de la conviction que chaque événement mérite d’être partagé avec le monde. Fondés à Dakar par deux passionnés de technologie et de création, nous avons construit une agence qui allie expertise technique et sensibilité multiculturelle."
export const ABOUT_MISSION_DEFAULT =
  "Démocratiser l’accès aux événements en direct en offrant des solutions de captation et de diffusion professionnelles, accessibles et adaptées au contexte africain."
export const ABOUT_VALUES_DEFAULT = [
  { title: "Excellence technique", description: "Matériel professionnel et qualité HD garantie sur chaque production." },
  { title: "Proximité", description: "Nous comprenons le contexte local et les enjeux de chaque événement." },
  { title: "Fiabilité", description: "Présence le jour J, backup systématique, zéro défaillance tolérée." },
  { title: "Innovation", description: "Veille permanente sur les nouvelles technologies de diffusion." },
]
export const ABOUT_STATS_DEFAULT = [
  { value: "50+", label: "événements diffusés" },
  { value: "3", label: "plateformes simultanées" },
  { value: "HD", label: "qualité garantie" },
  { value: "2026", label: "année de lancement" },
]

export const PARAM_KEYS = {
  // Entreprise
  company_name: "company_name",
  company_legal_form: "company_legal_form",
  company_ninea: "company_ninea",
  company_rc: "company_rc",
  company_address: "company_address",
  company_email: "company_email",
  company_phone: "company_phone",
  company_hours: "company_hours",
  company_wave_number: "company_wave_number",
  company_wave_link_template: "company_wave_link_template",
  company_bank_name: "company_bank_name",
  company_bank_iban: "company_bank_iban",
  // Mentions legales : responsable de publication
  company_publication_manager: "company_publication_manager",

  // Reseaux sociaux
  social_facebook: "social_facebook",
  social_instagram: "social_instagram",
  social_youtube: "social_youtube",
  social_linkedin: "social_linkedin",
  social_tiktok: "social_tiktok",

  // Emails admins
  admin1_email: "admin1_email",
  admin2_email: "admin2_email",

  // Documents PDF
  pdf_footer_text: "pdf_footer_text",
  pdf_signature_url: "pdf_signature_url",

  // Site public - Page A propos
  about_history: "about_history",
  about_mission: "about_mission",
  about_values: "about_values",
  about_team: "about_team",
  about_stats: "about_stats",
  about_hero_image: "about_hero_image",
  // Carrousel video du hero : duree d'une slide en secondes
  hero_slide_duration: "hero_slide_duration",

  // CGV et Mentions legales
  cgv_content: "cgv_content",
  mentions_legales_content: "mentions_legales_content",

  // Alertes factures
  invoice_alert_days: "invoice_alert_days",

  // Formations : delai de paiement d'une reservation, en heures (24 a 168)
  training_payment_delay_hours: "training_payment_delay_hours",
} as const

export type ParamKey = (typeof PARAM_KEYS)[keyof typeof PARAM_KEYS]

export const PUBLIC_PARAM_KEYS = new Set<string>([
  "company_name",
  "company_email",
  "company_phone",
  "company_address",
  "company_hours",
  "company_legal_form",
  "about_history",
  "about_mission",
  "about_stats",
  "about_team",
  "about_values",
  "about_hero_image",
  "hero_slide_duration",
  "social_facebook",
  "social_instagram",
  "social_youtube",
  "social_linkedin",
  "social_tiktok",
  "cgv_content",
  "mentions_legales_content",
  "pdf_footer_text",
])

export function isPublicParamKey(key: string): boolean {
  return PUBLIC_PARAM_KEYS.has(key)
}

export const PARAM_DEFAULTS: Record<string, string> = {
  company_name: "Jolof Stream",
  company_legal_form: "Entreprise individuelle",
  company_ninea: "",
  company_rc: "",
  company_address: "Dakar, Senegal",
  company_email: "jolofstream@gmail.com",
  company_phone: "+221 70 241 48 48",
  company_hours: "Lundi - Samedi, 8h - 20h",
  company_wave_number: "",
  company_wave_link_template: "",
  company_bank_name: "",
  company_bank_iban: "",
  company_publication_manager: "",

  social_facebook: "",
  social_instagram: "",
  social_youtube: "",
  social_linkedin: "",
  social_tiktok: "",

  admin1_email: "",
  admin2_email: "",

  pdf_footer_text:
    "Merci de votre confiance. Paiement par Wave Business ou virement bancaire.",
  pdf_signature_url: "",

  about_history: ABOUT_HISTORY_DEFAULT,
  about_mission: ABOUT_MISSION_DEFAULT,
  about_values: JSON.stringify(ABOUT_VALUES_DEFAULT),
  // Aucun membre fictif : l'equipe se renseigne dans l'admin
  about_team: "[]",
  about_stats: JSON.stringify(ABOUT_STATS_DEFAULT),
  about_hero_image: "",
  hero_slide_duration: "10",
  cgv_content: CGV_TEMPLATE_V2,
  mentions_legales_content: MENTIONS_TEMPLATE_V2,

  invoice_alert_days: "30",
  training_payment_delay_hours: "48",
}

export type AboutValue = { title: string; description: string }
export type AboutTeamMember = {
  firstName: string
  lastName: string
  role: string
  bio: string
  avatarUrl: string
}
export type AboutStat = { value: string; label: string }

export function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return parsed as T
  } catch {
    return fallback
  }
}
