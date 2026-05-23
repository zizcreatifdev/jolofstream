import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const campagneSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  subject: z.string().trim().min(1, "Objet requis"),
  body: z.string().min(1, "Contenu requis"),
  lists: z.array(z.string()).min(1, "Selectionnez au moins une liste"),
  templateType: z.string().optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
  status: z.enum(["brouillon", "planifie"]).optional(),
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
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "10"))
    )

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, campagnes, brouillons, planifies, envoyes] =
      await Promise.all([
        prisma.marketingCampaign.count({ where }),
        prisma.marketingCampaign.findMany({
          where,
          include: {
            creator: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.marketingCampaign.count({ where: { status: "brouillon" } }),
        prisma.marketingCampaign.count({ where: { status: "planifie" } }),
        prisma.marketingCampaign.count({ where: { status: "envoye" } }),
      ])

    return NextResponse.json({
      campagnes,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: brouillons + planifies + envoyes,
        brouillons,
        planifies,
        envoyes,
      },
    })
  } catch (error) {
    console.warn("[api/marketing/campagnes GET]", error)
    return NextResponse.json({
      campagnes: [],
      total: 0,
      pages: 1,
      stats: { total: 0, brouillons: 0, planifies: 0, envoyes: 0 },
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
    const data = campagneSchema.parse(body)

    const scheduledAt =
      data.scheduledAt && data.scheduledAt.length > 0
        ? new Date(data.scheduledAt)
        : null
    const status =
      data.status ?? (scheduledAt ? "planifie" : "brouillon")

    const campagne = await prisma.marketingCampaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        body: data.body,
        lists: data.lists,
        templateType: data.templateType || null,
        scheduledAt,
        status,
        createdBy: session.user.id,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "MarketingCampaign",
        entityId: campagne.id,
        description: `Campagne creee : ${campagne.title}`,
      },
    })

    return NextResponse.json(campagne, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/campagnes POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
