import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const invoiceWhere: Record<string, unknown> = {
      status: "payee",
      type: { not: "avoir" },
    }
    const expenseWhere: Record<string, unknown> = {}
    if (dateFrom || dateTo) {
      const invFilter: Record<string, Date> = {}
      const expFilter: Record<string, Date> = {}
      if (dateFrom) {
        invFilter.gte = new Date(dateFrom)
        expFilter.gte = new Date(dateFrom)
      }
      if (dateTo) {
        invFilter.lte = new Date(dateTo)
        expFilter.lte = new Date(dateTo)
      }
      invoiceWhere.paidAt = invFilter
      expenseWhere.date = expFilter
    }

    const projects = await prisma.project.findMany({
      include: {
        client: { select: { name: true } },
        invoices: { where: invoiceWhere, select: { totalTtc: true } },
        expenses: { where: expenseWhere, select: { amount: true } },
      },
    })

    const result = projects
      .map((p) => {
        const recettes = p.invoices.reduce((s, i) => s + i.totalTtc, 0)
        const depenses = p.expenses.reduce((s, e) => s + e.amount, 0)
        const benefice = recettes - depenses
        const marge = recettes > 0 ? (benefice / recettes) * 100 : 0
        return {
          id: p.id,
          title: p.title,
          client: p.client.name,
          status: p.status,
          recettes,
          depenses,
          benefice,
          marge,
        }
      })
      .filter((p) => p.recettes > 0 || p.depenses > 0)
      .sort((a, b) => b.recettes - a.recettes)

    return NextResponse.json({ projets: result })
  } catch (error) {
    console.warn("[api/comptabilite/rentabilite GET]", error)
    return NextResponse.json({ projets: [] })
  }
}
