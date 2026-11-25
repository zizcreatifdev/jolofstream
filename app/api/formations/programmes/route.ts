import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"
import { listProgramsWithStats } from "@/lib/training-program-stats"
import { programInputSchema } from "@/lib/training-programs"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    return NextResponse.json(await listProgramsWithStats())
  } catch (error) {
    console.error("[api/formations/programmes GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const data = programInputSchema.parse(await req.json())
    const taken = await prisma.trainingProgram.findUnique({ where: { slug: data.slug } })
    if (taken) {
      return NextResponse.json(
        { error: "Cette adresse est déjà utilisée par un autre programme.", issues: { slug: ["Adresse déjà utilisée"] } },
        { status: 409 }
      )
    }
    const last = await prisma.trainingProgram.aggregate({ _max: { order: true } })
    const created = await prisma.trainingProgram.create({
      data: { ...data, order: (last._max.order ?? -1) + 1 },
    })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "TrainingProgram",
        entityId: created.id,
        description: `Programme de formation créé : ${created.name}`,
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/programmes POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
