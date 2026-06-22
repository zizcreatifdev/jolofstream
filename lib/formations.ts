export const SESSION_STATUSES = {
  ouvert: { label: "Ouvert", color: "bg-green-100 text-green-700" },
  complet: { label: "Complet", color: "bg-red-100 text-red-700" },
  annule: { label: "Annule", color: "bg-zinc-200 text-zinc-500" },
} as const

export const REGISTRATION_STATUSES = {
  en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirme: { label: "Confirme", color: "bg-green-100 text-green-700" },
  annule: { label: "Annule", color: "bg-red-100 text-red-500" },
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

export function formatSessionDate(
  start: Date | string | null | undefined,
  end?: Date | string | null | undefined
) {
  if (!start) return "-"
  const startDate = typeof start === "string" ? new Date(start) : start
  if (Number.isNaN(startDate.getTime())) return "-"
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
