import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTotals } from "@/lib/documents"

const lineSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
})

const updateSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional().or(z.literal("")).nullable(),
  subject: z.string().trim().min(1).optional(),
  status: z.enum(["brouillon", "envoye", "accepte", "refuse"]).optional(),
  brsEnabled: z.boolean().optional(),
  tvaEnabled: z.boolean().optional(),
  validUntil: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
  lines: z.array(lineSchema).min(1).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        project: { select: { id: true, title: true } },
        lines: true,
        invoices: {
          select: {
            id: true,
            reference: true,
            status: true,
            totalTtc: true,
            type: true,
          },
        },
      },
    })
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }
    return NextResponse.json(quote)
  } catch (error) {
    console.error("[api/devis/:id GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const existing = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { client: true, lines: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }

    const clientId = data.clientId ?? existing.clientId
    const client =
      clientId === existing.clientId
        ? existing.client
        : await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 400 }
      )
    }

    const brsEnabled = data.brsEnabled ?? existing.brsEnabled
    const tvaEnabledRaw = data.tvaEnabled ?? existing.tvaEnabled
    const tvaEnabled = tvaEnabledRaw && !client.tvaExempt
    const linesInput =
      data.lines ??
      existing.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      }))

    const totals = calculateTotals(
      linesInput,
      brsEnabled,
      tvaEnabled,
      client.tvaExempt
    )

    const updated = await prisma.$transaction(async (tx) => {
      if (data.lines) {
        await tx.quoteLine.deleteMany({ where: { quoteId: params.id } })
      }
      return tx.quote.update({
        where: { id: params.id },
        data: {
          clientId,
          projectId:
            data.projectId === null
              ? null
              : data.projectId !== undefined
              ? data.projectId || null
              : undefined,
          subject: data.subject ?? undefined,
          status: data.status ?? undefined,
          brsEnabled,
          tvaEnabled,
          subtotalHt: totals.subtotalHt,
          brsAmount: totals.brsAmount,
          tvaAmount: totals.tvaAmount,
          totalTtc: totals.totalTtc,
          validUntil:
            data.validUntil === null
              ? null
              : data.validUntil !== undefined
              ? data.validUntil
                ? new Date(data.validUntil)
                : null
              : undefined,
          notes:
            data.notes === null
              ? null
              : data.notes !== undefined
              ? data.notes || null
              : undefined,
          ...(data.lines
            ? {
                lines: {
                  create: data.lines.map((l) => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    total: l.quantity * l.unitPrice,
                  })),
                },
              }
            : {}),
        },
        include: { lines: true, client: true, project: true },
      })
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Quote",
        entityId: updated.id,
        description: `Devis modifie : ${updated.reference}`,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/devis/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const quote = await prisma.quote.findUnique({ where: { id: params.id } })
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }
    if (quote.status !== "brouillon") {
      return NextResponse.json(
        {
          error:
            "Seuls les devis au statut Brouillon peuvent etre supprimes. Les autres sont conserves historiquement.",
        },
        { status: 403 }
      )
    }

    await prisma.quote.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Quote",
        entityId: params.id,
        description: `Devis supprime : ${quote.reference}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/devis/:id DELETE]", error)
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 }
    )
  }
}
