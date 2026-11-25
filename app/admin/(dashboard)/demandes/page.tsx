import { prisma } from "@/lib/prisma"
import {
  QUOTE_REQUEST_INCLUDE,
  listQuoteRequests,
  toQuoteRequestView,
} from "@/lib/quote-requests-server"
import { DemandesBoard } from "@/components/admin/demandes/demandes-board"

export const dynamic = "force-dynamic"

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: { statut?: string; besoin?: string; demande?: string }
}) {
  const [rows, grouped, selected] = await Promise.all([
    listQuoteRequests({ status: searchParams.statut, need: searchParams.besoin }).catch(() => []),
    prisma.quoteRequest.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    searchParams.demande
      ? prisma.quoteRequest.findUnique({ where: { id: searchParams.demande }, include: QUOTE_REQUEST_INCLUDE }).catch(() => null)
      : Promise.resolve(null),
  ])
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]))
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Demandes de devis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Demandes envoyées depuis la page Contact du site. Réponse promise sous 24h.
        </p>
      </div>
      <DemandesBoard
        demandes={rows.map(toQuoteRequestView)}
        counts={counts}
        status={searchParams.statut ?? ""}
        need={searchParams.besoin ?? ""}
        selected={selected ? toQuoteRequestView(selected) : null}
      />
    </div>
  )
}
