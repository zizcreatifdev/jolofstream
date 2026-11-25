import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { QUOTE_NEED_KEYS, QUOTE_STATUS_KEYS } from "@/lib/quote-requests"

export const QUOTE_REQUEST_INCLUDE = {
  client: { select: { id: true, name: true, email: true, phone: true, organization: true } },
  quote: { select: { id: true, reference: true, status: true } },
} as const

export type QuoteRequestRow = Prisma.QuoteRequestGetPayload<{ include: typeof QUOTE_REQUEST_INCLUDE }>

// Demandes filtrees par statut et besoin, les plus recentes d'abord
export async function listQuoteRequests(filters: { status?: string | null; need?: string | null }) {
  const where: Prisma.QuoteRequestWhereInput = {}
  if (filters.status && (QUOTE_STATUS_KEYS as string[]).includes(filters.status)) where.status = filters.status
  if (filters.need && (QUOTE_NEED_KEYS as string[]).includes(filters.need)) where.need = filters.need
  return prisma.quoteRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: QUOTE_REQUEST_INCLUDE,
    take: 500,
  })
}

export async function countNewQuoteRequests(): Promise<number> {
  return prisma.quoteRequest.count({ where: { status: "nouvelle" } })
}

// Vue serialisable (dates en ISO) pour les composants client
export function toQuoteRequestView(r: QuoteRequestRow) {
  return {
    id: r.id,
    need: r.need,
    desiredDate: r.desiredDate ? r.desiredDate.toISOString() : null,
    location: r.location,
    organization: r.organization,
    platforms: r.platforms,
    cameras: r.cameras,
    participants: r.participants,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    client: r.client,
    quote: r.quote,
  }
}

export type QuoteRequestView = ReturnType<typeof toQuoteRequestView>
