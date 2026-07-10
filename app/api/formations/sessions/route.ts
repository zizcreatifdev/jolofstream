import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trainingSessionSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const sessions = await prisma.trainingSession.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { location: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          status ? { status } : {},
        ],
      },
      include: {
        registrations: {
          select: { status: true },
        },
      },
      orderBy: { dateStart: "desc" },
    })

    const enriched = sessions.map((s) => {
      const counts = {
        en_attente: 0,
        confirme: 0,
        liste_attente: 0,
        annule: 0,
      }
      for (const r of s.registrations) {
        const key = r.status as keyof typeof counts
        if (key in counts) counts[key]++
      }
      const occupied = counts.en_attente + counts.confirme
      const remaining = Math.max(0, s.maxSeats - occupied)
      return {
        id: s.id,
        title: s.title,
        dateStart: s.dateStart,
        dateEnd: s.dateEnd,
        location: s.location,
        maxSeats: s.maxSeats,
        price: s.price,
        description: s.description,
        status: s.status,
        createdAt: s.createdAt,
        counts,
        remaining,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("[api/formations/sessions GET]", error)
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
    const data = trainingSessionSchema.parse(body)

    const created = await prisma.trainingSession.create({
      data: {
        title: data.title,
        dateStart: data.dateStart ? new Date(data.dateStart) : null,
        dateEnd: data.dateEnd ? new Date(data.dateEnd) : null,
        location: data.location,
        maxSeats: data.maxSeats,
        price: data.price,
        description: data.description || null,
        status: data.status,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "TrainingSession",
        entityId: created.id,
        description: `Session de formation creee : ${created.title}`,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/sessions POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
