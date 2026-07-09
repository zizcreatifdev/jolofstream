import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lines: true },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      )
    }
    if (invoice.type === "avoir") {
      return NextResponse.json(
        { error: "On ne cree pas d'avoir sur un avoir." },
        { status: 400 }
      )
    }

    const avoirReference = `${invoice.reference}-AVOIR`

    const existing = await prisma.invoice.findUnique({
      where: { reference: avoirReference },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Un avoir existe deja pour cette facture." },
        { status: 409 }
      )
    }

    const avoir = await prisma.invoice.create({
      data: {
        reference: avoirReference,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        quoteId: invoice.quoteId,
        type: "avoir",
        status: "emise",
        brsEnabled: invoice.brsEnabled,
        tvaEnabled: invoice.tvaEnabled,
        subtotalHt: -invoice.subtotalHt,
        brsAmount: -invoice.brsAmount,
        tvaAmount: -invoice.tvaAmount,
        totalTtc: -invoice.totalTtc,
        issuedAt: new Date(),
        notes: `Avoir sur facture ${invoice.reference}`,
        createdBy: session.user.id,
        lines: {
          create: invoice.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: -l.unitPrice,
            total: -l.total,
          })),
        },
      },
      include: { lines: true, client: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Invoice",
        entityId: avoir.id,
        description: `Avoir cree : ${avoir.reference} (sur ${invoice.reference})`,
      },
    })

    return NextResponse.json(avoir, { status: 201 })
  } catch (error) {
    console.error("[api/factures/:id/avoir]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
