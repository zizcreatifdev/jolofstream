import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import {
  SessionDetailView,
  type Registration,
  type SessionDetail,
} from "@/components/admin/formations/session-detail"
import {
  cohortDisplayName,
  type RegistrationStatus,
  type SessionStatus,
} from "@/lib/formations"

export default async function FormationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const record = await prisma.trainingSession
    .findUnique({
      where: { id: params.id },
      include: {
        program: { select: { id: true, name: true } },
        registrations: {
          orderBy: [
            { status: "asc" },
            { waitlistPosition: "asc" },
            { registeredAt: "asc" },
          ],
        },
      },
    })
    .catch(() => null)

  const programs = await prisma.trainingProgram
    .findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, name: true } })
    .catch(() => [])

  if (!record) {
    notFound()
  }

  const counts = {
    en_attente: 0,
    confirme: 0,
    liste_attente: 0,
    annule: 0,
  }
  for (const r of record.registrations) {
    const key = r.status as keyof typeof counts
    if (key in counts) counts[key]++
  }
  const occupied = counts.en_attente + counts.confirme
  const remaining = Math.max(0, record.maxSeats - occupied)

  const registrations: Registration[] = record.registrations.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    status: r.status as RegistrationStatus,
    waitlistPosition: r.waitlistPosition,
    registeredAt: r.registeredAt.toISOString(),
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    message: r.message,
    amountPaid: r.amountPaid,
    holdExpiresAt: r.holdExpiresAt ? r.holdExpiresAt.toISOString() : null,
  }))

  const session: SessionDetail = {
    id: record.id,
    title: record.title,
    displayName: cohortDisplayName(record),
    label: record.label,
    scheduleText: record.scheduleText,
    program: record.program,
    dateStart: record.dateStart ? record.dateStart.toISOString() : null,
    dateEnd: record.dateEnd ? record.dateEnd.toISOString() : null,
    location: record.location,
    maxSeats: record.maxSeats,
    price: record.price,
    description: record.description,
    status: record.status as SessionStatus,
    registrations,
    counts,
    remaining,
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
          <Link href="/admin/formations" className="hover:text-zinc-900">
            Formations
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href={`/admin/formations/programmes/${record.program.id}`} className="hover:text-zinc-900">
            {record.program.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-zinc-700" aria-current="page">
            {record.label || "Cohorte"}
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-zinc-900">Détail de la cohorte</h1>
      </div>
      <SessionDetailView session={session} programs={programs} />
    </div>
  )
}
