import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { cohortDisplayName, isHoldOverdue } from "@/lib/formations"
import { readCurriculum, readStats } from "@/lib/training-programs"
import {
  ProgramEditor,
  type CohortRow,
  type ProgramData,
  type ProgramTestimonial,
} from "@/components/admin/formations/program-editor"

export const dynamic = "force-dynamic"

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { onglet?: string }
}) {
  const record = await prisma.trainingProgram
    .findUnique({
      where: { id: params.id },
      include: {
        cohorts: {
          orderBy: [{ dateStart: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
          include: {
            program: { select: { name: true } },
            registrations: { select: { status: true, holdExpiresAt: true, amountPaid: true } },
          },
        },
        testimonials: { orderBy: { order: "asc" } },
      },
    })
    .catch(() => null)
  if (!record) notFound()

  const now = new Date()
  const program: ProgramData = {
    id: record.id,
    slug: record.slug,
    code: record.code,
    name: record.name,
    tagline: record.tagline,
    description: record.description,
    disciplines: record.disciplines,
    sessionsCount: record.sessionsCount,
    theoryHours: record.theoryHours,
    practiceHours: record.practiceHours,
    level: record.level,
    audience: record.audience,
    objectives: record.objectives,
    curriculum: readCurriculum(record.curriculum),
    stats: readStats(record.stats),
    leadName: record.leadName,
    leadRole: record.leadRole,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    defaultPrice: record.defaultPrice,
    defaultMaxSeats: record.defaultMaxSeats,
    published: record.published,
    brochureUrl: record.brochureUrl,
    brochureTitle: record.brochureTitle,
    brochureFileName: record.brochureFileName,
    brochureSize: record.brochureSize,
    brochurePages: record.brochurePages,
    brochureUpdatedAt: record.brochureUpdatedAt ? record.brochureUpdatedAt.toISOString() : null,
    brochurePublished: record.brochurePublished,
  }

  const cohorts: CohortRow[] = record.cohorts.map((c) => {
    let pending = 0
    let confirmed = 0
    let waitlist = 0
    let overdue = 0
    for (const r of c.registrations) {
      if (r.status === "en_attente") {
        pending++
        if (isHoldOverdue(r, now)) overdue++
      } else if (r.status === "confirme") confirmed++
      else if (r.status === "liste_attente") waitlist++
    }
    return {
      id: c.id,
      displayName: cohortDisplayName(c),
      label: c.label,
      dateStart: c.dateStart ? c.dateStart.toISOString() : null,
      dateEnd: c.dateEnd ? c.dateEnd.toISOString() : null,
      scheduleText: c.scheduleText,
      location: c.location,
      status: c.status,
      maxSeats: c.maxSeats,
      price: c.price,
      pending,
      confirmed,
      waitlist,
      overdue,
    }
  })

  const testimonials: ProgramTestimonial[] = record.testimonials.map((t) => ({
    id: t.id,
    quote: t.quote,
    authorName: t.authorName,
    authorRole: t.authorRole,
    published: t.published,
  }))

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
          <Link href="/admin/formations" className="hover:text-zinc-900">
            Formations
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-zinc-700" aria-current="page">
            {record.name}
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-zinc-900">{record.name}</h1>
      </div>
      <ProgramEditor
        program={program}
        cohorts={cohorts}
        testimonials={testimonials}
        initialTab={searchParams.onglet}
        siteUrl={(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com").replace(/\/+$/, "")}
      />
    </div>
  )
}
