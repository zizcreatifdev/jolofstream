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
  description: z.string().min(1),
  projectId: z.string().optional().or(z.literal("")),
})

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
    console.error("[api/depenses POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
