import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1).optional(),
  type: z
    .enum([
      "streaming_live",
      "ceo_content",
      "creator_weekend",
      "gestion_reseaux",
      "autre",
    ])
    .optional(),
  status: z
    .enum(["prospect", "confirme", "en_cours", "livre", "archive", "perdu"])
    .optional(),
  date: z.string().optional().or(z.literal("")).nullable(),
  location: z.string().optional().or(z.literal("")).nullable(),
  budgetEstimate: z.number().optional().nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        quotes: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        expenses: { orderBy: { date: "desc" } },
        contracts: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            quotes: true,
            invoices: true,
            expenses: true,
            contracts: true,
          },
        },
      },
    })
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error("[api/projets/:id GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.clientId !== undefined) updateData.clientId = data.clientId
    if (data.title !== undefined) updateData.title = data.title
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.date !== undefined) {
      updateData.date = data.date ? new Date(data.date) : null
    }
    if (data.location !== undefined) {
      updateData.location = data.location || null
    }
    if (data.budgetEstimate !== undefined) {
      updateData.budgetEstimate = data.budgetEstimate
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Project",
        entityId: project.id,
        description: `Projet modifie : ${project.title}`,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/projets/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      )
    }

    if (project.status !== "prospect") {
      return NextResponse.json(
        {
          error:
            "Seuls les projets au statut Prospect peuvent etre supprimes. Les autres sont archives.",
        },
        { status: 403 }
      )
    }

    await prisma.project.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Project",
        entityId: params.id,
        description: `Projet supprime : ${project.title}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/projets/:id DELETE]", error)
    return NextResponse.json(
      {
        error:
          "Suppression impossible. Verifiez que le projet n'a pas de devis ou facture associes.",
      },
      { status: 500 }
    )
  }
}
