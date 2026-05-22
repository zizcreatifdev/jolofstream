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
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )
    const clientId = searchParams.get("clientId") ?? ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Record<string, unknown> = {
      status: "payee",
      type: { not: "avoir" },
    }
    if (clientId) where.clientId = clientId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.paidAt = dateFilter
    }

    const [total, recettes, totalSum] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { paidAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.aggregate({ _sum: { totalTtc: true }, where }),
    ])

    return NextResponse.json({
      recettes,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      totalMontant: totalSum._sum.totalTtc ?? 0,
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
