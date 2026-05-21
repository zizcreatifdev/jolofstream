import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  calculateTotals,
  generateInvoiceReference,
} from "@/lib/documents"

const lineSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional().or(z.literal("")),
  quoteId: z.string().optional().or(z.literal("")),
  type: z
    .enum(["standard", "acompte", "solde", "avoir"])
    .default("standard"),
  status: z
    .enum(["emise", "payee", "partiellement_payee", "annulee"])
    .default("emise"),
  brsEnabled: z.boolean().default(false),
  tvaEnabled: z.boolean().default(false),
  dueAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(lineSchema).min(1),
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
    const type = searchParams.get("type") ?? ""
    const clientId = searchParams.get("clientId") ?? ""
    const projectId = searchParams.get("projectId") ?? ""

    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { reference: { contains: search, mode: "insensitive" } },
                  {
                    client: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
          status ? { status } : {},
          type ? { type } : {},
          clientId ? { clientId } : {},
          projectId ? { projectId } : {},
        ],
      },
      include: {
        client: { select: { id: true, name: true, organization: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[api/factures GET]", error)
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
    const data = invoiceSchema.parse(body)

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

    const invoice = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoice.count({
        where: { reference: { startsWith: `FAC-${year}-JS-` } },
      })
      const reference = generateInvoiceReference(year, sequence + 1)

      return tx.invoice.create({
        data: {
          reference,
          clientId: data.clientId,
          projectId: data.projectId || null,
          quoteId: data.quoteId || null,
          type: data.type,
          status: data.status,
          subtotalHt: totals.subtotalHt,
          brsAmount: totals.brsAmount,
          tvaAmount: totals.tvaAmount,
          totalTtc: totals.totalTtc,
          issuedAt: new Date(),
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
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
        entityType: "Invoice",
        entityId: invoice.id,
        description: `Facture creee : ${invoice.reference}`,
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
    console.error("[api/factures POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
