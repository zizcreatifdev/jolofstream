import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"

export const dynamic = "force-dynamic"

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) })

// Nouvel ordre complet des programmes : order = position dans ids
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const { ids } = schema.parse(await req.json())
    const existing = await prisma.trainingProgram.findMany({ select: { id: true } })
    const known = new Set(existing.map((p) => p.id))
    if (
      new Set(ids).size !== ids.length ||
      ids.length !== known.size ||
      ids.some((id) => !known.has(id))
    ) {
      return NextResponse.json(
        { error: "La liste a changé entre-temps. Rechargez la page." },
        { status: 409 }
      )
    }
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.trainingProgram.update({ where: { id }, data: { order: index } })
      )
    )
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingProgram",
        entityId: ids[0],
        description: "Ordre des programmes de formation modifié",
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/programmes/reorder]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
