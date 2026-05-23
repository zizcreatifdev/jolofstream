export const PARAM_KEYS = {
  // Entreprise
  company_name: "company_name",
  company_legal_form: "company_legal_form",
  company_ninea: "company_ninea",
  company_rc: "company_rc",
  company_address: "company_address",
  company_email: "company_email",
  company_phone: "company_phone",
  company_wave_number: "company_wave_number",
  company_wave_link_template: "company_wave_link_template",
  company_bank_name: "company_bank_name",
  company_bank_iban: "company_bank_iban",

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

  // Site public - Temoignages
  testimonials: "testimonials",

  // CGV et Mentions legales
  cgv_content: "cgv_content",
  mentions_legales_content: "mentions_legales_content",

  // Alertes factures
  invoice_alert_days: "invoice_alert_days",
} as const

export type ParamKey = (typeof PARAM_KEYS)[keyof typeof PARAM_KEYS]

export const PARAM_DEFAULTS: Record<string, string> = {
  company_name: "Jolof Stream",
  company_legal_form: "Entreprise individuelle",
  company_ninea: "",
  company_rc: "",
  company_address: "Dakar, Senegal",
  company_email: "jolofstream@gmail.com",
  company_phone: "+221 70 241 48 48",
  company_wave_number: "",
  company_wave_link_template: "",
  company_bank_name: "",
  company_bank_iban: "",

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

  about_history:
    "Jolof Stream est nee de la conviction que chaque evenement merite d'etre partage avec le monde. Fondes a Dakar par deux passionnes de technologie et de creation, nous avons construit une agence qui allie expertise technique et sensibilite multiculturelle.",
  about_mission:
    "Democratiser l'acces aux evenements en direct en offrant des solutions de captation et de diffusion professionnelles, accessibles et adaptees au contexte africain.",
  about_values: JSON.stringify([
    {
      title: "Excellence technique",
      description: "Materiel professionnel, qualite HD garantie",
    },
    {
      title: "Proximite",
      description: "Nous comprenons le contexte local",
    },
    {
      title: "Fiabilite",
      description: "Presence le jour J, backup systematique",
    },
    {
      title: "Innovation",
      description: "Veille permanente sur les nouvelles technologies",
    },
  ]),
  about_team: JSON.stringify([
    {
      firstName: "Prenom",
      lastName: "Nom",
      role: "Cofondateur & Directeur technique",
      bio: "Expert en captation et diffusion live.",
      avatarUrl: "",
    },
    {
      firstName: "Prenom",
      lastName: "Nom",
      role: "Cofondateur & Directeur creatif",
      bio: "Specialiste en creation de contenu video.",
      avatarUrl: "",
    },
  ]),
  about_stats: JSON.stringify([
    { value: "50+", label: "evenements diffuses" },
    { value: "3", label: "plateformes simultanees" },
    { value: "HD", label: "qualite garantie" },
    { value: "2026", label: "annee de lancement" },
  ]),
  about_hero_image: "",
  testimonials: JSON.stringify([
    {
      name: "Aminata Toure",
      organization: "Directrice marketing, Fintech Dakar",
      text: "Jolof Stream a transforme notre conference annuelle en un evenement vu par toute la diaspora. Production impeccable.",
      rating: 5,
    },
    {
      name: "Ousmane Sow",
      organization: "Fondateur, Studio Baobab",
      text: "Le Creator Weekend nous a permis de produire trois mois de contenu en deux jours.",
      rating: 5,
    },
    {
      name: "Marie Diop",
      organization: "Chef de projet, ONG Teranga",
      text: "Streaming bilingue francais-wolof sans accroc pour notre gala.",
      rating: 5,
    },
  ]),
  cgv_content:
    "Conditions Generales de Vente - Jolof Stream\n\nA completer juridiquement avant publication.",
  mentions_legales_content:
    "Mentions Legales - Jolof Stream\n\nEditeur : Jolof Stream\nAdresse : Dakar, Senegal\nContact : jolofstream@gmail.com",

  invoice_alert_days: "30",
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
export type Testimonial = {
  name: string
  organization: string
  text: string
  rating: number
}

export function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return parsed as T
  } catch {
    return fallback
  }
}
