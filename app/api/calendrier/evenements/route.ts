import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis"),
    date: z.string().min(1, "Date requise"),
    endDate: z.string().optional().or(z.literal("")),
    type: z.enum(["evenement", "reunion", "rappel", "conge", "autre"]),
    notes: z.string().optional().or(z.literal("")),
  })
  .transform((data) => ({
    ...data,
    endDate: data.endDate || undefined,
    notes: data.notes || undefined,
  }))

const MANUAL_EVENT_COLORS: Record<string, string> = {
  evenement: "#EA580C",
  reunion: "#3B82F6",
  rappel: "#DB2777",
  conge: "#9CA3AF",
  autre: "#9CA3AF",
}
const MANUAL_EVENT_DEFAULT_COLOR = "#9CA3AF"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const year = Number(searchParams.get("year") ?? now.getFullYear())
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const events = await prisma.calendarEvent.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.warn("[api/calendrier/evenements GET]", error)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const parsedDate = new Date(data.date)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 })
    }
    const parsedEnd = data.endDate ? new Date(data.endDate) : null
    if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        date: parsedDate,
        endDate: parsedEnd,
        type: data.type,
        color: MANUAL_EVENT_COLORS[data.type] ?? MANUAL_EVENT_DEFAULT_COLOR,
        notes: data.notes,
        createdBy: session.user.id,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "CalendarEvent",
        entityId: event.id,
        description: `Evenement calendrier ajoute : ${event.title}`,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/calendrier/evenements POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
