import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const portfolioSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum([
    "streaming_live",
    "ceo_content",
    "creator_weekend",
    "formations",
  ]),
  date: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  mediaType: z.enum(["photo", "youtube"]),
  mediaUrl: z.string().trim().url("URL invalide"),
  published: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const publishedParam = searchParams.get("published")
    const typeFilter = searchParams.get("type") ?? ""
    const limitParam = searchParams.get("limit")

    const where: Record<string, unknown> = {}
    if (publishedParam === "true") where.published = true
    else if (publishedParam === "false") where.published = false
    if (typeFilter) where.type = typeFilter

    const items = await prisma.portfolioItem.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: limitParam ? Math.max(1, Math.min(50, Number(limitParam))) : undefined,
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("[api/portfolio GET]", error)
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
    const data = portfolioSchema.parse(body)

    const item = await prisma.portfolioItem.create({
      data: {
        title: data.title,
        type: data.type,
        date: data.date ? new Date(data.date) : null,
        description: data.description || null,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        published: data.published,
        displayOrder: data.displayOrder,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "PortfolioItem",
        entityId: item.id,
        description: `Realisation creee : ${item.title}`,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/portfolio POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
