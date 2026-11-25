import { z } from "zod"

import { PHONE_ERROR, normalizePhone } from "@/lib/phone"

// Demandes de devis du site (/contact, modele QuoteRequest) : regles
// partagees par l'assistant, l'API publique et l'admin.

export const QUOTE_NEEDS = {
  evenement_live: { label: "Événement en direct", hint: "Conférence, gala, cérémonie, lancement", slug: "evenement-live" },
  ceo_content: { label: "CEO Content", hint: "On vient chez vous, vous recevez vos vidéos", slug: "ceo-content" },
  creator_weekend: { label: "Creator Weekend", hint: "Un week-end complet pour votre concept", slug: "creator-weekend" },
  formation: { label: "Formation", hint: "Session ou formation pour votre équipe", slug: "formation" },
  autre: { label: "Autre projet", hint: "Parlons-en, on trouve la formule", slug: "autre" },
} as const

export type QuoteNeed = keyof typeof QUOTE_NEEDS
export const QUOTE_NEED_KEYS = Object.keys(QUOTE_NEEDS) as QuoteNeed[]

export const QUOTE_PLATFORMS = {
  youtube: "YouTube",
  facebook: "Facebook",
  zoom: "Zoom",
  instagram: "Instagram",
  prive: "Diffusion privée",
  aucune: "Pas de diffusion",
} as const
export type QuotePlatform = keyof typeof QUOTE_PLATFORMS
export const QUOTE_PLATFORM_KEYS = Object.keys(QUOTE_PLATFORMS) as QuotePlatform[]

export const QUOTE_CAMERAS = {
  "1": "1 caméra",
  "2": "2 caméras",
  "3": "3 caméras",
  "4_plus": "4 et plus",
  ne_sait_pas: "Je ne sais pas",
} as const
export type QuoteCameras = keyof typeof QUOTE_CAMERAS
export const QUOTE_CAMERA_KEYS = Object.keys(QUOTE_CAMERAS) as QuoteCameras[]

export const QUOTE_STATUSES = {
  nouvelle: { label: "Nouvelle", color: "bg-red-50 text-red-700" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700" },
  devis_envoye: { label: "Devis envoyé", color: "bg-yellow-50 text-yellow-800" },
  convertie: { label: "Convertie", color: "bg-emerald-50 text-emerald-700" },
  sans_suite: { label: "Sans suite", color: "bg-zinc-100 text-zinc-600" },
} as const
export type QuoteStatus = keyof typeof QUOTE_STATUSES
export const QUOTE_STATUS_KEYS = Object.keys(QUOTE_STATUSES) as QuoteStatus[]

// Preselection depuis l'URL : ?besoin=... ou l'ancien ?service=...
const BESOIN_ALIASES: Record<string, QuoteNeed> = {
  "evenement-live": "evenement_live",
  "ceo-content": "ceo_content",
  "creator-weekend": "creator_weekend",
  formation: "formation",
  "formation-entreprise": "formation",
  autre: "autre",
}
const SERVICE_ALIASES: Record<string, QuoteNeed> = {
  "captation-streaming-live": "evenement_live",
  "ceo-content-package": "ceo_content",
  "creator-weekend": "creator_weekend",
  "gestion-reseaux": "autre",
  autre: "autre",
}

export function needFromParams(besoin: string | null | undefined, service: string | null | undefined): QuoteNeed | null {
  if (besoin && BESOIN_ALIASES[besoin]) return BESOIN_ALIASES[besoin]
  if (service && SERVICE_ALIASES[service]) return SERVICE_ALIASES[service]
  return null
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

function todayDakar(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar" }).format(new Date())
}

// Demande envoyee par l'assistant. desiredDate : AAAA-MM-JJ, ou null pour
// « Date à définir ». Plateformes et cameras pour un evenement en direct
// seulement, participants pour une formation seulement. "website" : champ piege.
export const quoteRequestInputSchema = z
  .object({
    need: z.enum(QUOTE_NEED_KEYS as [QuoteNeed, ...QuoteNeed[]], { message: "Choisissez votre besoin" }),
    desiredDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide")
      .refine((v) => v === null || v >= todayDakar(), "Choisissez une date à venir"),
    location: z.string().trim().min(1, "Lieu requis").max(160, "160 caractères maximum"),
    organization: optionalText(120),
    platforms: z.array(z.enum(QUOTE_PLATFORM_KEYS as [QuotePlatform, ...QuotePlatform[]])).max(6).default([]),
    cameras: z
      .enum(QUOTE_CAMERA_KEYS as [QuoteCameras, ...QuoteCameras[]])
      .optional()
      .nullable()
      .transform((v) => v ?? null),
    participants: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 200), "Entre 1 et 200 participants"),
    description: optionalText(2000),
    firstName: z.string().trim().min(1, "Prénom requis").max(80, "80 caractères maximum"),
    lastName: z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum"),
    email: z.string().trim().min(1, "Email requis").email("Email invalide").max(160),
    phone: z
      .string()
      .trim()
      .min(1, "Téléphone requis")
      .refine((v) => normalizePhone(v) !== null, PHONE_ERROR)
      .transform((v) => normalizePhone(v) as string),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.need !== "evenement_live") {
      if (data.platforms.length > 0)
        ctx.addIssue({ code: "custom", path: ["platforms"], message: "Réservé à un événement en direct" })
      if (data.cameras)
        ctx.addIssue({ code: "custom", path: ["cameras"], message: "Réservé à un événement en direct" })
    } else if (data.platforms.includes("aucune") && data.platforms.length > 1) {
      ctx.addIssue({ code: "custom", path: ["platforms"], message: "« Pas de diffusion » exclut les autres choix" })
    }
    if (data.need !== "formation" && data.participants !== null) {
      ctx.addIssue({ code: "custom", path: ["participants"], message: "Réservé à une formation" })
    }
  })

export type QuoteRequestInput = z.input<typeof quoteRequestInputSchema>

// Changement de statut depuis l'admin
export const quoteRequestStatusSchema = z.object({
  status: z.enum(QUOTE_STATUS_KEYS as [QuoteStatus, ...QuoteStatus[]]),
})

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

// Date souhaitee (stockee a minuit UTC) : « 12 mars 2027 » ou « À définir »
export function desiredDateLabel(date: Date | string | null | undefined): string {
  if (!date) return "À définir"
  return DATE_FMT.format(new Date(date))
}

export function platformsLabel(platforms: string[]): string | null {
  if (!platforms.length) return null
  return platforms.map((p) => QUOTE_PLATFORMS[p as QuotePlatform] ?? p).join(", ")
}

export function needLabel(need: string): string {
  return QUOTE_NEEDS[need as QuoteNeed]?.label ?? need
}

export function camerasLabel(cameras: string | null | undefined): string | null {
  if (!cameras) return null
  return QUOTE_CAMERAS[cameras as QuoteCameras] ?? cameras
}

// Lien WhatsApp (wa.me) depuis un numero normalise
export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "")
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}
