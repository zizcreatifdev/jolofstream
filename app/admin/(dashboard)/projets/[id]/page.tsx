import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { prisma } from "@/lib/prisma"
import {
  ProjectDetailView,
  type ProjectDetail,
} from "@/components/admin/projets/project-detail"
import type { ProjectStatus, ProjectType } from "@/lib/projets"

export default async function ProjetDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const record = await prisma.project
    .findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: { id: true, name: true, organization: true },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reference: true,
            status: true,
            totalTtc: true,
            createdAt: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reference: true,
            status: true,
            totalTtc: true,
            createdAt: true,
          },
        },
        expenses: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            category: true,
            amount: true,
            date: true,
            description: true,
          },
        },
      },
    })
    .catch(() => null)

  if (!record) {
    notFound()
  }

  const project: ProjectDetail = {
    id: record.id,
    title: record.title,
    type: record.type as ProjectType,
    status: record.status as ProjectStatus,
    date: record.date,
    location: record.location,
    budgetEstimate: record.budgetEstimate,
    notes: record.notes,
    client: record.client,
    quotes: record.quotes,
    invoices: record.invoices,
    expenses: record.expenses,
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin/projets"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour aux projets
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Fiche projet</h1>
      </div>
      <ProjectDetailView project={project} />
    </div>
  )
}
