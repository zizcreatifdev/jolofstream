import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) })

// Nouvel ordre complet apres un glisser-deposer : order = position dans ids
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const { ids } = schema.parse(await req.json())
    const existing = await prisma.heroSlide.findMany({ select: { id: true } })
    const known = new Set(existing.map((s) => s.id))
    const unique = new Set(ids)
    if (
      unique.size !== ids.length ||
      ids.length !== known.size ||
      ids.some((id) => !known.has(id))
    ) {
      return NextResponse.json(
        { error: "La liste a change entre-temps. Rechargez la page." },
        { status: 409 }
      )
    }
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.heroSlide.update({ where: { id }, data: { order: index } })
      )
    )
    revalidatePath("/")
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/hero-slides/reorder]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
