import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TEMPLATE_TYPE_KEYS } from "@/lib/contrats"

const contratSchema = z.object({
  projectId: z.string().min(1, "Projet requis"),
  clientId: z.string().min(1, "Client requis"),
  templateType: z.enum(
    TEMPLATE_TYPE_KEYS as [string, ...string[]]
  ),
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
    const clientId = searchParams.get("clientId") ?? ""
    const projectId = searchParams.get("projectId") ?? ""
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (projectId) where.projectId = projectId
    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { project: { title: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [total, contrats] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, organization: true } },
          project: { select: { id: true, title: true, type: true } },
          creator: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      contrats,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.warn("[api/contrats GET]", error)
    return NextResponse.json({ contrats: [], total: 0, pages: 1 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = contratSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, clientId: true, title: true },
    })
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      )
    }

    const contract = await prisma.contract.create({
      data: {
        projectId: data.projectId,
        clientId: data.clientId,
        templateType: data.templateType,
        notes: data.notes?.trim() || null,
        status: "a_envoyer",
        createdBy: session.user.id,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Contract",
        entityId: contract.id,
        description: `Contrat cree pour ${project.title}`,
      },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/contrats POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
