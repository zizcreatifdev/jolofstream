import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { removeReplacedFiles } from "@/lib/storage-cleanup"
import {
  HERO_BUCKET,
  heroSlideInputSchema,
  toHeroSlideData,
  toHeroSlideView,
} from "@/lib/hero-slides"

export const dynamic = "force-dynamic"

// Activation seule (interrupteur de la liste) ou mise a jour complete
const toggleSchema = z.object({ active: z.boolean() }).strict()

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const existing = await prisma.heroSlide.findUnique({
      where: { id: params.id },
      select: { id: true, mp4Url: true, posterUrl: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Slide introuvable" }, { status: 404 })
    }

    const body = await req.json()
    const toggle = toggleSchema.safeParse(body)
    const data = toggle.success
      ? { active: toggle.data.active }
      : toHeroSlideData(heroSlideInputSchema.parse(body))

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data,
    })

    // Video ou couverture remplacee : l'ancien fichier du bucket est supprime
    if (!toggle.success) {
      await removeReplacedFiles(
        HERO_BUCKET,
        [existing.mp4Url, existing.posterUrl],
        [slide.mp4Url, slide.posterUrl]
      )
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "HeroSlide",
        entityId: slide.id,
        description: toggle.success
          ? `Slide hero ${slide.active ? "activee" : "desactivee"} : ${slide.titleLine1}`
          : `Slide hero modifiée : ${slide.titleLine1} ${slide.titleLine2}`,
      },
    })
    revalidatePath("/")
    return NextResponse.json(toHeroSlideView(slide))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/hero-slides/:id PATCH]", error)
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
    const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!slide) {
      return NextResponse.json({ error: "Slide introuvable" }, { status: 404 })
    }
    await prisma.heroSlide.delete({ where: { id: params.id } })

    // Fichiers du bucket hero devenus inutiles (suppression best effort)
    await removeReplacedFiles(HERO_BUCKET, [slide.mp4Url, slide.posterUrl], [])

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "HeroSlide",
        entityId: slide.id,
        description: `Slide hero supprimée : ${slide.titleLine1} ${slide.titleLine2}`,
      },
    })
    revalidatePath("/")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/hero-slides/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
