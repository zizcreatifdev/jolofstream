import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRecuReference } from "@/lib/formations"

type RecetteRow = {
  id: string
  reference: string
  totalTtc: number
  paidAt: string | null
  issuedAt: string | null
  client: { id: string; name: string } | null
  project: { id: string; title: string } | null
  source: "invoice" | "formation"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )
    const clientId = searchParams.get("clientId") ?? ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const invoiceWhere: Record<string, unknown> = {
      status: "payee",
      type: { not: "avoir" },
    }
    if (clientId) invoiceWhere.clientId = clientId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      invoiceWhere.paidAt = dateFilter
    }

    const formationWhere: Record<string, unknown> = { status: "confirme" }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      formationWhere.confirmedAt = dateFilter
    }

    const [invoices, formations] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          client: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { paidAt: "desc" },
      }),
      clientId
        ? Promise.resolve([])
        : prisma.trainingRegistration.findMany({
            where: formationWhere,
            include: {
              session: { select: { id: true, title: true, price: true } },
            },
            orderBy: { confirmedAt: "desc" },
          }),
    ])

    const invoiceRows: RecetteRow[] = invoices.map((i) => ({
      id: i.id,
      reference: i.reference,
      totalTtc: i.totalTtc,
      paidAt: i.paidAt ? i.paidAt.toISOString() : null,
      issuedAt: i.issuedAt ? i.issuedAt.toISOString() : null,
      client: i.client ? { id: i.client.id, name: i.client.name } : null,
      project: i.project ? { id: i.project.id, title: i.project.title } : null,
      source: "invoice",
    }))

    const formationRows: RecetteRow[] = formations.map((r) => ({
      id: r.id,
      reference: generateRecuReference(r.id),
      totalTtc: r.session.price,
      paidAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
      issuedAt: r.registeredAt.toISOString(),
      client: { id: r.id, name: `${r.firstName} ${r.lastName}` },
      project: { id: r.session.id, title: r.session.title },
      source: "formation",
    }))

    const all = [...invoiceRows, ...formationRows].sort((a, b) => {
      const ta = a.paidAt ? new Date(a.paidAt).getTime() : 0
      const tb = b.paidAt ? new Date(b.paidAt).getTime() : 0
      return tb - ta
    })

    const total = all.length
    const pages = Math.max(1, Math.ceil(total / limit))
    const slice = all.slice((page - 1) * limit, page * limit)
    const totalMontant = all.reduce((s, r) => s + r.totalTtc, 0)

    return NextResponse.json({
      recettes: slice,
      total,
      pages,
      totalMontant,
    })
  } catch (error) {
    console.warn("[api/comptabilite/recettes GET]", error)
    return NextResponse.json({
      recettes: [],
      total: 0,
      pages: 1,
      totalMontant: 0,
    })
  }
}
