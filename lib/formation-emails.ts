import type { FormationEmailDetails } from "@/emails/_formation"
import { prisma } from "@/lib/prisma"
import {
  cohortDisplayName,
  formatDeadline,
  formatPrice,
  formatSessionDate,
} from "@/lib/formations"
import { brochurePublicPath } from "@/lib/training-programs"

export const SESSION_EMAIL_INCLUDE = {
  program: {
    select: { name: true, slug: true, published: true, brochurePublished: true, brochureUrl: true },
  },
} as const

type SessionForEmail = {
  title: string
  label: string | null
  scheduleText: string | null
  dateStart: Date | null
  dateEnd: Date | null
  location: string
  price: number
  program: {
    name: string
    slug: string
    published: boolean
    brochurePublished: boolean
    brochureUrl: string | null
  } | null
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com").replace(/\/+$/, "")
}

// Dates de la cohorte, ou texte libre de planning, ou "Dates à venir"
export function cohortDatesText(session: {
  dateStart: Date | null
  dateEnd: Date | null
  scheduleText: string | null
}): string {
  const schedule = session.scheduleText?.trim()
  if (session.dateStart) {
    const dates = formatSessionDate(session.dateStart, session.dateEnd)
    return schedule ? `${dates} (${schedule})` : dates
  }
  return schedule || "Dates à venir"
}

function buildWaveLink(template: string | null, amount: number): string | undefined {
  if (!template) return undefined
  return template.replace(/{montant}/g, String(amount))
}

export async function getWaveTemplate(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "company_wave_link_template" } })
  return row?.value || null
}

export function buildFormationEmailDetails(
  session: SessionForEmail,
  input: { firstName: string; deadline?: Date | null; waveTemplate: string | null }
): FormationEmailDetails {
  const program = session.program
  const brochureUrl =
    program && program.published && program.brochurePublished && program.brochureUrl
      ? `${siteUrl()}${brochurePublicPath(program.slug)}`
      : undefined
  return {
    firstName: input.firstName,
    programName: program?.name ?? cohortDisplayName(session),
    cohortName: cohortDisplayName(session),
    sessionDate: cohortDatesText(session),
    sessionLocation: session.location,
    price: formatPrice(session.price),
    waveLink: buildWaveLink(input.waveTemplate, session.price),
    deadline: input.deadline ? formatDeadline(input.deadline) : undefined,
    brochureUrl,
  }
}
