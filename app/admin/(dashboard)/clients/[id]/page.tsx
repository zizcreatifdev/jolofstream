import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { prisma } from "@/lib/prisma"
import {
  ClientDetailView,
  type ClientDetail,
} from "@/components/admin/clients/client-detail"
import type { ClientStatus, ClientType } from "@/lib/clients"

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const record = await prisma.client
    .findUnique({
      where: { id: params.id },
      include: {
        projects: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
            date: true,
          },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 20,
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
          take: 20,
          select: {
            id: true,
            reference: true,
            status: true,
            totalTtc: true,
            createdAt: true,
          },
        },
        _count: {
          select: { projects: true, quotes: true, invoices: true },
        },
      },
    })
    .catch(() => null)

  if (!record) {
    notFound()
  }

  const client: ClientDetail = {
    id: record.id,
    type: record.type as ClientType,
    name: record.name,
    email: record.email,
    phone: record.phone,
    organization: record.organization,
    acquisitionChannel: record.acquisitionChannel,
    status: record.status as ClientStatus,
    tvaExempt: record.tvaExempt,
    notes: record.notes,
    tags: record.tags,
    projects: record.projects,
    quotes: record.quotes,
    invoices: record.invoices,
    _count: record._count,
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin/clients"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour aux clients
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Fiche client</h1>
      </div>
      <ClientDetailView client={client} />
    </div>
  )
}
