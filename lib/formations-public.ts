import { prisma } from "@/lib/prisma"
import { cohortDisplayName } from "@/lib/formations"
import {
  COHORT_STATUS_LABELS,
  cohortDatesLabel,
  cohortDayBadge,
  cohortPublicStatus,
  compareCohorts,
  formatFileSize,
  isCohortUpcoming,
  monthYearLabel,
  seatsLeft,
  type CohortPublicStatus,
} from "@/lib/cohort-public"
import { brochurePublicPath, readCurriculum, readStats, type CurriculumItem, type StatItem } from "@/lib/training-programs"
import { toTestimonialView, type TestimonialView } from "@/lib/testimonials"

// Donnees publiques des formations : programmes publies, cohortes visibles
// (non annulees, non passees), places et statut. Source unique de la page
// /formations, du tunnel /formations/reserver, de l'accueil et du hero.

export type PublicCohort = {
  id: string
  programId: string
  name: string
  label: string | null
  dateStart: string | null
  dateEnd: string | null
  datesLabel: string
  dayBadge: { day: string; month: string } | null
  location: string
  price: number
  maxSeats: number
  taken: number
  left: number
  status: CohortPublicStatus
  statusLabel: string
}

export type PublicBrochure = {
  title: string
  href: string
  viewHref: string
  meta: string
  size: string | null
}

export type PublicProgram = {
  id: string
  slug: string
  code: string | null
  name: string
  tagline: string | null
  description: string | null
  disciplines: string[]
  sessionsCount: number | null
  theoryHours: number | null
  practiceHours: number | null
  level: string | null
  audience: string | null
  objectives: string[]
  curriculum: CurriculumItem[]
  stats: StatItem[]
  leadName: string | null
  leadRole: string | null
  contactEmail: string | null
  contactPhone: string | null
  seatsPerCohort: number | null
  minPrice: number | null
  brochure: PublicBrochure | null
  cohorts: PublicCohort[]
  updatedAt: string
}

const OCCUPYING = ["en_attente", "confirme"]

type CohortRecord = {
  id: string
  programId: string
  title: string
  label: string | null
  scheduleText: string | null
  dateStart: Date | null
  dateEnd: Date | null
  location: string
  price: number
  maxSeats: number
  status: string
  _count: { registrations: number }
}

export function toPublicCohort(c: CohortRecord, programName: string): PublicCohort {
  const left = seatsLeft(c.maxSeats, c._count.registrations)
  const status = cohortPublicStatus({ status: c.status, maxSeats: c.maxSeats, left })
  return {
    id: c.id,
    programId: c.programId,
    name: cohortDisplayName({ ...c, program: { name: programName } }),
    label: c.label,
    dateStart: c.dateStart ? c.dateStart.toISOString() : null,
    dateEnd: c.dateEnd ? c.dateEnd.toISOString() : null,
    datesLabel: cohortDatesLabel(c),
    dayBadge: cohortDayBadge(c.dateStart),
    location: c.location,
    price: c.price,
    maxSeats: c.maxSeats,
    taken: c._count.registrations,
    left,
    status,
    statusLabel: COHORT_STATUS_LABELS[status],
  }
}

const COHORT_INCLUDE = {
  where: { status: { not: "annule" } },
  include: {
    _count: { select: { registrations: { where: { status: { in: OCCUPYING } } } } },
  },
} as const

// Programmes publies (ordre de l'admin) avec leurs cohortes visibles
export async function getPublicPrograms(now: Date = new Date()): Promise<PublicProgram[]> {
  const rows = await prisma.trainingProgram.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { cohorts: COHORT_INCLUDE },
  })
  return rows.map((p) => {
    const cohorts = p.cohorts
      .filter((c) => isCohortUpcoming(c, now))
      .sort(compareCohorts)
      .map((c) => toPublicCohort(c, p.name))
    const size = formatFileSize(p.brochureSize)
    const brochure: PublicBrochure | null =
      p.brochurePublished && p.brochureUrl
        ? {
            title: p.brochureTitle || `Plaquette ${p.name}`,
            href: brochurePublicPath(p.slug),
            viewHref: `${brochurePublicPath(p.slug)}?mode=view`,
            size,
            meta: [
              "Plaquette",
              p.brochurePages ? `${p.brochurePages} pages` : null,
              size,
              monthYearLabel(p.brochureUpdatedAt),
            ]
              .filter(Boolean)
              .join(" · "),
          }
        : null
    return {
      id: p.id,
      slug: p.slug,
      code: p.code,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      disciplines: p.disciplines,
      sessionsCount: p.sessionsCount,
      theoryHours: p.theoryHours,
      practiceHours: p.practiceHours,
      level: p.level,
      audience: p.audience,
      objectives: p.objectives,
      curriculum: readCurriculum(p.curriculum),
      stats: readStats(p.stats),
      leadName: p.leadName,
      leadRole: p.leadRole,
      contactEmail: p.contactEmail,
      contactPhone: p.contactPhone,
      seatsPerCohort: p.defaultMaxSeats ?? cohorts[0]?.maxSeats ?? null,
      minPrice: cohorts.length ? Math.min(...cohorts.map((c) => c.price)) : null,
      brochure,
      cohorts,
      updatedAt: p.updatedAt.toISOString(),
    }
  })
}

export async function getPublicProgramsSafe(): Promise<PublicProgram[]> {
  try {
    return await getPublicPrograms()
  } catch (error) {
    console.warn("[formations-public] programmes indisponibles", error)
    return []
  }
}

// Toutes les cohortes visibles, tous programmes confondus, dans l'ordre
export function upcomingCohorts(
  programs: PublicProgram[]
): Array<PublicCohort & { programSlug: string; programName: string }> {
  return programs
    .flatMap((p) => p.cohorts.map((c) => ({ ...c, programSlug: p.slug, programName: p.name })))
    .sort(compareCohorts)
}

// Temoignages FORMATION publies avec accord, par programme
export async function getProgramTestimonials(
  programIds: string[]
): Promise<Record<string, TestimonialView[]>> {
  if (programIds.length === 0) return {}
  try {
    const rows = await prisma.testimonial.findMany({
      where: { context: "FORMATION", published: true, consent: true, programId: { in: programIds } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
    const result: Record<string, TestimonialView[]> = {}
    for (const row of rows) {
      if (!row.programId) continue
      ;(result[row.programId] ??= []).push(toTestimonialView(row))
    }
    return result
  } catch (error) {
    console.warn("[formations-public] temoignages indisponibles", error)
    return {}
  }
}

// Une cohorte peut-elle recevoir une reservation publique ? (C4)
export type CohortAvailability =
  | { ok: true }
  | { ok: false; reason: "introuvable" | "annulee" | "passee" | "programme_masque" }

export function cohortAvailability(
  cohort: {
    status: string
    dateStart: Date | null
    dateEnd: Date | null
    program: { published: boolean } | null
  } | null,
  now: Date = new Date()
): CohortAvailability {
  if (!cohort) return { ok: false, reason: "introuvable" }
  if (cohort.status === "annule") return { ok: false, reason: "annulee" }
  if (!cohort.program?.published) return { ok: false, reason: "programme_masque" }
  if (!isCohortUpcoming(cohort, now)) return { ok: false, reason: "passee" }
  return { ok: true }
}

export const AVAILABILITY_MESSAGES: Record<Exclude<CohortAvailability, { ok: true }>["reason"], string> = {
  introuvable: "Cette cohorte n'existe pas.",
  annulee: "Cette cohorte a été annulée : choisissez une autre date.",
  passee: "Cette cohorte est terminée : choisissez une date à venir.",
  programme_masque: "Cette formation n'est plus proposée en ligne.",
}
