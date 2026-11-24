import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  MAX_HERO_SLIDES,
  heroSlideInputSchema,
  toHeroSlideData,
  toHeroSlideView,
} from "@/lib/hero-slides"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ slides: slides.map(toHeroSlideView) })
  } catch (error) {
    console.error("[api/hero-slides GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const data = heroSlideInputSchema.parse(await req.json())

    const count = await prisma.heroSlide.count()
    if (count >= MAX_HERO_SLIDES) {
      return NextResponse.json(
        {
          error: `${MAX_HERO_SLIDES} slides maximum. Supprimez-en une avant d'en ajouter une nouvelle.`,
        },
        { status: 409 }
      )
    }
    const last = await prisma.heroSlide.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const slide = await prisma.heroSlide.create({
      data: { ...toHeroSlideData(data), order: (last?.order ?? -1) + 1 },
    })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "HeroSlide",
        entityId: slide.id,
        description: `Slide hero creee : ${slide.titleLine1} ${slide.titleLine2}`,
      },
    })
    revalidatePath("/")
    return NextResponse.json(toHeroSlideView(slide), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/hero-slides POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
