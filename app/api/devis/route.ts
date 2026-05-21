import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  calculateTotals,
  generateQuoteReference,
} from "@/lib/documents"

const lineSchema = z.object({
  description: z.string().trim().min(1, "Description requise"),
  quantity: z.number().positive("Quantite positive requise"),
  unitPrice: z.number().nonnegative("Prix unitaire requis"),
})

const quoteSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Objet requis"),
  status: z
    .enum(["brouillon", "envoye", "accepte", "refuse"])
    .default("brouillon"),
  brsEnabled: z.boolean().default(false),
  tvaEnabled: z.boolean().default(false),
  validUntil: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(lineSchema).min(1, "Au moins une ligne requise"),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const clientId = searchParams.get("clientId") ?? ""
    const projectId = searchParams.get("projectId") ?? ""

    const quotes = await prisma.quote.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { reference: { contains: search, mode: "insensitive" } },
                  { subject: { contains: search, mode: "insensitive" } },
                  {
                    client: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
          status ? { status } : {},
          clientId ? { clientId } : {},
          projectId ? { projectId } : {},
        ],
      },
      include: {
        client: { select: { id: true, name: true, organization: true } },
        project: { select: { id: true, title: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error("[api/devis GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = quoteSchema.parse(body)

    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    })
    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 400 }
      )
    }

    const totals = calculateTotals(
      data.lines,
      data.brsEnabled,
      data.tvaEnabled,
      client.tvaExempt
    )

    const year = new Date().getFullYear()

    const quote = await prisma.$transaction(async (tx) => {
      const sequence = await tx.quote.count({
        where: { reference: { startsWith: `DEV-${year}-JS-` } },
      })
      const reference = generateQuoteReference(year, sequence + 1)

      return tx.quote.create({
        data: {
          reference,
          clientId: data.clientId,
          projectId: data.projectId || null,
          subject: data.subject,
          status: data.status,
          brsEnabled: data.brsEnabled,
          tvaEnabled: data.tvaEnabled && !client.tvaExempt,
          subtotalHt: totals.subtotalHt,
          brsAmount: totals.brsAmount,
          tvaAmount: totals.tvaAmount,
          totalTtc: totals.totalTtc,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes || null,
          createdBy: session.user.id,
          lines: {
            create: data.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              total: l.quantity * l.unitPrice,
            })),
          },
        },
        include: {
          lines: true,
          client: { select: { id: true, name: true, organization: true } },
          project: { select: { id: true, title: true } },
        },
      })
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Quote",
        entityId: quote.id,
        description: `Devis cree : ${quote.reference}`,
      },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/devis POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
