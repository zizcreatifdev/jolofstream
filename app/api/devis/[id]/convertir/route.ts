import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoiceReference } from "@/lib/documents"

const convertSchema = z.object({
  type: z.enum(["standard", "acompte"]).default("standard"),
  dueDate: z.string().optional().or(z.literal("")),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { type, dueDate } = convertSchema.parse(body)

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { lines: true },
    })
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }
    if (quote.status !== "accepte") {
      return NextResponse.json(
        { error: "Seuls les devis acceptes peuvent etre convertis." },
        { status: 403 }
      )
    }

    const year = new Date().getFullYear()

    const invoice = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoice.count({
        where: { reference: { startsWith: `FAC-${year}-JS-` } },
      })
      const reference = generateInvoiceReference(year, sequence + 1)

      return tx.invoice.create({
        data: {
          reference,
          clientId: quote.clientId,
          projectId: quote.projectId,
          quoteId: quote.id,
          type,
          status: "emise",
          subtotalHt: quote.subtotalHt,
          brsAmount: quote.brsAmount,
          tvaAmount: quote.tvaAmount,
          totalTtc: quote.totalTtc,
          issuedAt: new Date(),
          dueAt: dueDate ? new Date(dueDate) : null,
          notes: quote.notes,
          createdBy: session.user.id,
          lines: {
            create: quote.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              total: l.total,
            })),
          },
        },
        include: { lines: true, client: true, project: true },
      })
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        description: `Facture creee depuis devis ${quote.reference} : ${invoice.reference}`,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/devis/:id/convertir]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
