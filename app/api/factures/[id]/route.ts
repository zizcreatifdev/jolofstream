import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  status: z.enum(["emise", "payee", "partiellement_payee", "annulee"]),
  paidAt: z.string().optional().or(z.literal("")).nullable(),
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
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        project: { select: { id: true, title: true } },
        quote: { select: { id: true, reference: true } },
        lines: true,
      },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[api/factures/:id GET]", error)
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

    const updateData: Record<string, unknown> = { status: data.status }
    if (data.status === "payee") {
      updateData.paidAt = data.paidAt ? new Date(data.paidAt) : new Date()
    } else if (data.status === "annulee") {
      updateData.paidAt = null
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Invoice",
        entityId: invoice.id,
        description: `Facture ${invoice.reference} - statut ${data.status}`,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/factures/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
