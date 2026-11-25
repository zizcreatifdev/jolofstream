import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  dueDate: z.string().optional().or(z.literal("")).nullable(),
  assignedTo: z.string().optional().or(z.literal("")).nullable(),
  completed: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo || null
    }
    if (data.completed !== undefined) updateData.completed = data.completed

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Task",
        entityId: task.id,
        description:
          data.completed === true
            ? `Tâche complétée : ${task.title}`
            : data.completed === false
              ? `Tâche re-ouverte : ${task.title}`
              : `Tâche modifiée : ${task.title}`,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/taches/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })
    }
    if (task.createdBy !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Seul le créateur de la tâche peut la supprimer. Vous pouvez la marquer comme complétée à la place.",
        },
        { status: 403 }
      )
    }

    await prisma.task.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Task",
        entityId: params.id,
        description: `Tâche supprimée : ${task.title}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/taches/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
