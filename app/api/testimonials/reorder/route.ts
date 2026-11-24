import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TESTIMONIAL_PATHS, revalidateSite } from "@/lib/revalidate-site"

export const dynamic = "force-dynamic"

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) })

// Nouvel ordre complet : order = position dans ids
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const { ids } = schema.parse(await req.json())
    const existing = await prisma.testimonial.findMany({ select: { id: true } })
    const known = new Set(existing.map((t) => t.id))
    if (
      new Set(ids).size !== ids.length ||
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
        prisma.testimonial.update({ where: { id }, data: { order: index } })
      )
    )
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Testimonial",
        entityId: ids[0],
        description: "Ordre des temoignages modifie",
      },
    })
    revalidateSite(TESTIMONIAL_PATHS)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/testimonials/reorder]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
