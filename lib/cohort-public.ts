// Regles publiques d'une cohorte (sans acces base : utilisables par le
// serveur et par le tunnel de reservation)

export type CohortPublicStatus = "open" | "soon" | "full"

export const COHORT_STATUS_LABELS: Record<CohortPublicStatus, string> = {
  open: "Ouverte",
  soon: "Bientôt complète",
  full: "Complète",
}

const TZ = "Africa/Dakar"

// Places : occupees = en attente de paiement + confirmees ; jamais negatif
export function seatsLeft(maxSeats: number, occupied: number): number {
  return Math.max(0, maxSeats - occupied)
}

// Complete (liste d'attente) si plus de place ou statut "complet" ;
// bientot complete a 20 % de places restantes ou moins ; ouverte sinon
export function cohortPublicStatus(input: {
  status: string
  maxSeats: number
  left: number
}): CohortPublicStatus {
  if (input.left <= 0 || input.status === "complet") return "full"
  if (input.maxSeats > 0 && input.left / input.maxSeats <= 0.2) return "soon"
  return "open"
}

// Jour calendaire a Dakar, au format AAAA-MM-JJ (comparable en texte)
export function dakarDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

// Cohorte non passee : fin (ou debut) aujourd'hui ou plus tard, ou sans date
export function isCohortUpcoming(
  cohort: { dateStart: Date | null; dateEnd: Date | null },
  now: Date = new Date()
): boolean {
  const ref = cohort.dateEnd ?? cohort.dateStart
  if (!ref) return true
  return dakarDayKey(ref) >= dakarDayKey(now)
}

// Tri : date de debut croissante, cohortes sans date en dernier
export function compareCohorts(
  a: { dateStart: Date | string | null },
  b: { dateStart: Date | string | null }
): number {
  if (!a.dateStart && !b.dateStart) return 0
  if (!a.dateStart) return 1
  if (!b.dateStart) return -1
  return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
}

type Parts = { day: number; month: string; year: number }

function parts(date: Date): Parts {
  const f = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date)
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? ""
  return { day: Number(get("day")), month: get("month"), year: Number(get("year")) }
}

const dayText = (d: number) => (d === 1 ? "1er" : String(d))

// « du 5 au 9 décembre 2026 », « du 28 novembre au 3 décembre 2026 »,
// « du 28 décembre 2026 au 3 janvier 2027 », « le 5 décembre 2026 »
export function cohortDatesLabel(input: {
  dateStart: Date | string | null
  dateEnd: Date | string | null
  scheduleText?: string | null
}): string {
  if (!input.dateStart) return input.scheduleText?.trim() || "Dates à venir"
  const s = parts(new Date(input.dateStart))
  const e = input.dateEnd ? parts(new Date(input.dateEnd)) : null
  if (!e || (e.day === s.day && e.month === s.month && e.year === s.year)) {
    return `le ${dayText(s.day)} ${s.month} ${s.year}`
  }
  if (s.year !== e.year) {
    return `du ${dayText(s.day)} ${s.month} ${s.year} au ${dayText(e.day)} ${e.month} ${e.year}`
  }
  if (s.month !== e.month) {
    return `du ${dayText(s.day)} ${s.month} au ${dayText(e.day)} ${e.month} ${e.year}`
  }
  return `du ${dayText(s.day)} au ${dayText(e.day)} ${e.month} ${e.year}`
}

// Pastille de date d'une ligne de cohorte : « 05 » et « déc. 2026 »
export function cohortDayBadge(dateStart: Date | string | null): { day: string; month: string } | null {
  if (!dateStart) return null
  const d = new Date(dateStart)
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "2-digit" }).format(d)
  const month = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, month: "short", year: "numeric" }).format(d)
  return { day, month }
}

// Date courte du badge du hero : « 7 janv. »
export function shortDayMonth(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" }).format(
    new Date(date)
  )
}

// Delai de paiement affiche : « 48h », ou « 3 jours » pour un multiple de
// 24 h superieur a 48 h
export function paymentDelayLabel(hours: number): string {
  if (hours > 48 && hours % 24 === 0) return `${hours / 24} jours`
  return `${hours}h`
}

export function placesLeftText(left: number, max: number): string {
  if (left <= 0) return "Aucune place restante"
  return `${left} ${left > 1 ? "places restantes" : "place restante"} sur ${max}`
}

export function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`
}

// Taille de plaquette : « 2,6 Mo » (ou Ko sous 1 Mo)
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
}

// « Octobre 2026 »
export function monthYearLabel(date: Date | string | null | undefined): string | null {
  if (!date) return null
  const text = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, month: "long", year: "numeric" }).format(
    new Date(date)
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}
