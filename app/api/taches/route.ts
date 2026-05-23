import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const taskSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  dueDate: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const completedParam = searchParams.get("completed")
    const assignedTo = searchParams.get("assignedTo") ?? ""
    const where: Record<string, unknown> = {}
    if (completedParam === "true") where.completed = true
    else if (completedParam === "false") where.completed = false
    if (assignedTo) where.assignedTo = assignedTo

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.warn("[api/taches GET]", error)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = taskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedTo: data.assignedTo || null,
        createdBy: session.user.id,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Task",
        entityId: task.id,
        description: `Tache creee : ${task.title}`,
      },
    })

    if (data.assignedTo && data.assignedTo !== session.user.id) {
      try {
        await createNotification({
          userId: data.assignedTo,
          type: "tache_assignee",
          title: "Nouvelle tache assignee",
          message: `Une tache vous a ete assignee : ${task.title}`,
          entityType: "Task",
          entityId: task.id,
          entityUrl: "/admin/journal",
        })
      } catch (e) {
        console.warn("[api/taches] notification echec", e)
      }
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/taches POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
