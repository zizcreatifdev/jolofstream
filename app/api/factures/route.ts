import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  calculateTotals,
  formatAmount,
  formatDate,
  generateInvoiceReference,
} from "@/lib/documents"
import { sendEmail } from "@/lib/email"
import FactureEmiseEmail from "@/emails/facture-emise"

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
}).refine((data) => !(data.brsEnabled && data.tvaEnabled), {
  message: "BRS et TVA ne peuvent pas etre actives simultanement",
  path: ["brsEnabled"],
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

    // Email facture emise (echec non bloquant)
    try {
      if (client.email) {
        const settings = await prisma.setting.findMany({
          where: {
            key: {
              in: [
                "company_wave_number",
                "company_bank_name",
                "company_bank_iban",
              ],
            },
          },
        })
        const map: Record<string, string> = {}
        for (const s of settings) map[s.key] = s.value
        const bankInfo =
          map.company_bank_name && map.company_bank_iban
            ? `${map.company_bank_name} - ${map.company_bank_iban}`
            : undefined
        const firstName = client.name.split(/\s+/)[0] || client.name
        await sendEmail({
          to: client.email,
          subject: `Votre facture ${invoice.reference} - Jolof Stream`,
          react: FactureEmiseEmail({
            clientFirstName: firstName,
            reference: invoice.reference,
            totalTtc: formatAmount(invoice.totalTtc),
            dueDate: invoice.dueAt ? formatDate(invoice.dueAt) : undefined,
            waveNumber: map.company_wave_number || undefined,
            bankInfo,
          }),
        })
      }
    } catch (e) {
      console.warn("[api/factures POST] email facture echoue", e)
    }

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
