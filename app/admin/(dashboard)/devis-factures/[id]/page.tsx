import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { prisma } from "@/lib/prisma"
import {
  DocumentDetailView,
  type DocumentDetail,
} from "@/components/admin/documents/document-detail"
import type { InvoiceType } from "@/lib/documents"

function toISO(date: Date | null) {
  return date ? date.toISOString() : null
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { kind?: string }
}) {
  const kind = searchParams.kind === "facture" ? "facture" : "devis"

  let doc: DocumentDetail | null = null

  if (kind === "devis") {
    const quote = await prisma.quote
      .findUnique({
        where: { id: params.id },
        include: { client: true, project: true, lines: true },
      })
      .catch(() => null)
    if (quote) {
      doc = {
        id: quote.id,
        kind: "devis",
        reference: quote.reference,
        subject: quote.subject,
        status: quote.status,
        client: {
          id: quote.client.id,
          name: quote.client.name,
          organization: quote.client.organization,
          email: quote.client.email,
          phone: quote.client.phone,
          tvaExempt: quote.client.tvaExempt,
        },
        project: quote.project
          ? { id: quote.project.id, title: quote.project.title }
          : null,
        brsEnabled: quote.brsEnabled,
        tvaEnabled: quote.tvaEnabled,
        subtotalHt: quote.subtotalHt,
        brsAmount: quote.brsAmount,
        tvaAmount: quote.tvaAmount,
        totalTtc: quote.totalTtc,
        validUntil: toISO(quote.validUntil),
        createdAt: quote.createdAt.toISOString(),
        notes: quote.notes,
        lines: quote.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
        })),
      }
    }
  } else {
    const invoice = await prisma.invoice
      .findUnique({
        where: { id: params.id },
        include: { client: true, project: true, lines: true },
      })
      .catch(() => null)
    if (invoice) {
      doc = {
        id: invoice.id,
        kind: "facture",
        reference: invoice.reference,
        status: invoice.status,
        invoiceType: invoice.type as InvoiceType,
        client: {
          id: invoice.client.id,
          name: invoice.client.name,
          organization: invoice.client.organization,
          email: invoice.client.email,
          phone: invoice.client.phone,
          tvaExempt: invoice.client.tvaExempt,
        },
        project: invoice.project
          ? { id: invoice.project.id, title: invoice.project.title }
          : null,
        brsEnabled: invoice.brsAmount !== 0,
        tvaEnabled: invoice.tvaAmount !== 0,
        subtotalHt: invoice.subtotalHt,
        brsAmount: invoice.brsAmount,
        tvaAmount: invoice.tvaAmount,
        totalTtc: invoice.totalTtc,
        dueAt: toISO(invoice.dueAt),
        issuedAt: toISO(invoice.issuedAt),
        createdAt: invoice.createdAt.toISOString(),
        notes: invoice.notes,
        lines: invoice.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
        })),
      }
    }
  }

  if (!doc) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin/devis-factures"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour aux documents
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">
          {doc.kind === "devis" ? "Detail devis" : "Detail facture"}
        </h1>
      </div>
      <DocumentDetailView doc={doc} />
    </div>
  )
}
