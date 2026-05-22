import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const expenseSchema = z.object({
  category: z.enum([
    "equipement",
    "transport",
    "sous_traitance",
    "charges_fixes",
    "marketing",
    "divers",
  ]),
  amount: z.number().positive(),
  date: z.string().min(1),
  description: z.string().trim().min(1),
  projectId: z.string().optional().or(z.literal("")),
})

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
    const category = searchParams.get("category") ?? ""
    const projectId = searchParams.get("projectId") ?? ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search") ?? ""

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (projectId) where.projectId = projectId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }
    if (search) {
      where.description = { contains: search, mode: "insensitive" }
    }

    const [total, depenses, totalSum] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { project: { select: { id: true, title: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.aggregate({ _sum: { amount: true }, where }),
    ])

    return NextResponse.json({
      depenses,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      totalMontant: totalSum._sum.amount ?? 0,
    })
  } catch (error) {
    console.warn("[api/comptabilite/depenses GET]", error)
    return NextResponse.json({
      depenses: [],
      total: 0,
      pages: 1,
      totalMontant: 0,
    })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = expenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        projectId: data.projectId || null,
        createdBy: session.user.id,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Expense",
        entityId: expense.id,
        description: `Depense ajoutee : ${expense.description} (${expense.amount} FCFA)`,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/comptabilite/depenses POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
