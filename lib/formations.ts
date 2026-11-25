export const SESSION_STATUSES = {
  ouvert: { label: "Ouvert", color: "bg-green-100 text-green-700" },
  complet: { label: "Complet", color: "bg-red-100 text-red-700" },
  annule: { label: "Annulé", color: "bg-zinc-200 text-zinc-500" },
} as const

export const REGISTRATION_STATUSES = {
  en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirme: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  annule: { label: "Annulé", color: "bg-red-100 text-red-500" },
  liste_attente: {
    label: "Liste d'attente",
    color: "bg-blue-100 text-blue-700",
  },
} as const

export type SessionStatus = keyof typeof SESSION_STATUSES
export type RegistrationStatus = keyof typeof REGISTRATION_STATUSES

export const SESSION_STATUS_KEYS = Object.keys(
  SESSION_STATUSES
) as SessionStatus[]
export const REGISTRATION_STATUS_KEYS = Object.keys(
  REGISTRATION_STATUSES
) as RegistrationStatus[]

export function getJaugePercent(confirmed: number, maxSeats: number): number {
  if (maxSeats === 0) return 0
  return Math.min(100, Math.round((confirmed / maxSeats) * 100))
}

export function isBientotComplet(
  remaining: number,
  maxSeats: number
): boolean {
  if (maxSeats === 0) return false
  return remaining > 0 && remaining / maxSeats <= 0.2
}

export const DATE_TO_CONFIRM_LABEL = "Date à confirmer"
export const DURATION_TO_CONFIRM_LABEL = "Durée à confirmer"

export function formatSessionDate(
  start: Date | string | null | undefined,
  end?: Date | string | null | undefined
) {
  if (!start) return DATE_TO_CONFIRM_LABEL
  const startDate = typeof start === "string" ? new Date(start) : start
  if (Number.isNaN(startDate.getTime())) return DATE_TO_CONFIRM_LABEL
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  if (!end) return fmt.format(startDate)
  const endDate = typeof end === "string" ? new Date(end) : end
  if (Number.isNaN(endDate.getTime())) return fmt.format(startDate)
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + " FCFA"
  )
}

export function generateRecuReference(
  inscriptionId: string,
  year: number = new Date().getFullYear()
): string {
  const suffix = inscriptionId.slice(-4).toUpperCase()
  return `REF-${year}-JS-${suffix}`
}

export function toDatetimeLocal(
  value: Date | string | null | undefined
): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  )
}

// Nom affiche d'une cohorte : "Programme · libellé", sinon "Programme · mois
// année", sinon "Programme". Seule source du nom d'une cohorte (comptabilite,
// recu, emails, calendrier, journal, notifications). Repli sur le titre stocke
// si le programme n'est pas charge.
export type CohortNameSource = {
  title?: string | null
  label?: string | null
  dateStart?: Date | string | null
  program?: { name: string } | null
}

// Selection Prisma minimale pour calculer le nom d'une cohorte
export const COHORT_NAME_SELECT = {
  title: true,
  label: true,
  dateStart: true,
  program: { select: { name: true } },
} as const

const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "Africa/Dakar",
})

export function cohortDisplayName(session: CohortNameSource): string {
  const programName = session.program?.name?.trim()
  const fallback = (session.title ?? "").replace(/\s+/g, " ").trim()
  const base = programName || fallback || "Formation"
  const label = session.label?.trim()
  if (label) return `${base} · ${label}`
  if (programName && session.dateStart) {
    const date = typeof session.dateStart === "string" ? new Date(session.dateStart) : session.dateStart
    if (!Number.isNaN(date.getTime())) return `${base} · ${MONTH_YEAR.format(date)}`
  }
  return base
}

// Titre stocke d'une cohorte (colonne title conservee pour compatibilite)
export function cohortStoredTitle(programName: string, label?: string | null): string {
  const l = label?.trim()
  return l ? `${programName} · ${l}` : programName
}

// Delai de paiement : echeance, etat "hors delai" calcule (la place reste comptee)
export function holdDeadline(hours: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + hours * 3_600_000)
}

export function isHoldOverdue(
  registration: { status: string; holdExpiresAt?: Date | string | null },
  now: Date = new Date()
): boolean {
  if (registration.status !== "en_attente" || !registration.holdExpiresAt) return false
  const d =
    typeof registration.holdExpiresAt === "string"
      ? new Date(registration.holdExpiresAt)
      : registration.holdExpiresAt
  return d.getTime() < now.getTime()
}

const DEADLINE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
})

// "mardi 1 décembre 2026 à 14:30" (heure de Dakar)
export function formatDeadline(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value
  return DEADLINE_FMT.format(d)
}

const SHORT_DEADLINE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
})

export function formatShortDeadline(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value
  return SHORT_DEADLINE_FMT.format(d)
}
