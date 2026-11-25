import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { QUOTE_STATUSES, needLabel, quoteRequestStatusSchema, type QuoteStatus } from "@/lib/quote-requests"
import { QUOTE_REQUEST_INCLUDE, toQuoteRequestView } from "@/lib/quote-requests-server"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const row = await prisma.quoteRequest.findUnique({ where: { id: params.id }, include: QUOTE_REQUEST_INCLUDE })
  if (!row) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
  return NextResponse.json(toQuoteRequestView(row))
}

// Changement de statut (journalise)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  try {
    const { status } = quoteRequestStatusSchema.parse(await req.json())
    const existing = await prisma.quoteRequest.findUnique({ where: { id: params.id }, include: { client: { select: { name: true } } } })
    if (!existing) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    if (existing.status === status) {
      const same = await prisma.quoteRequest.findUnique({ where: { id: params.id }, include: QUOTE_REQUEST_INCLUDE })
      return NextResponse.json(toQuoteRequestView(same!))
    }
    const updated = await prisma.quoteRequest.update({
      where: { id: params.id },
      data: { status },
      include: QUOTE_REQUEST_INCLUDE,
    })
    const from = QUOTE_STATUSES[existing.status as QuoteStatus]?.label ?? existing.status
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "QuoteRequest",
        entityId: updated.id,
        description: `Demande de devis de ${existing.client.name} (${needLabel(existing.need)}) : ${from} vers ${QUOTE_STATUSES[status].label}`,
      },
    })
    return NextResponse.json(toQuoteRequestView(updated))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", issues: error.flatten().fieldErrors }, { status: 400 })
    }
    console.error("[api/demandes/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
