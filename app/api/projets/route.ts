import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const projectSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum([
    "streaming_live",
    "ceo_content",
    "creator_weekend",
    "gestion_reseaux",
    "autre",
  ]),
  status: z
    .enum(["prospect", "confirme", "en_cours", "livre", "archive", "perdu"])
    .default("prospect"),
  date: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  budgetEstimate: z.number().optional().nullable(),
  notes: z.string().optional().or(z.literal("")),
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

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { location: { contains: search, mode: "insensitive" } },
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
        ],
      },
      include: {
        client: {
          select: { id: true, name: true, organization: true },
        },
        _count: { select: { quotes: true, invoices: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("[api/projets GET]", error)
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
    const data = projectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        clientId: data.clientId,
        title: data.title,
        type: data.type,
        status: data.status,
        date: data.date ? new Date(data.date) : null,
        location: data.location || null,
        budgetEstimate: data.budgetEstimate ?? null,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Project",
        entityId: project.id,
        description: `Projet cree : ${project.title}`,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/projets POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
