import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Evenement = {
  id: string
  title: string
  date: string
  type: "projet" | "formation" | "tache" | "evenement_manuel"
  subtype: string
  status: string
  clientName?: string
  url: string
  color: string
  manualId?: string
  createdBy?: string
  notes?: string
}

const TYPE_COLORS: Record<string, string> = {
  streaming_live: "#C8151B",
  captation_streaming_live: "#C8151B",
  ceo_content: "#8B5CF6",
  ceo_content_package: "#8B5CF6",
  creator_weekend: "#F5B800",
  gestion_reseaux: "#0891B2",
  autre: "#6B7280",
}

const FORMATION_ODD_COLOR = "#059669"
const FORMATION_EVEN_COLOR = "#34D399"

const MANUAL_EVENT_COLORS: Record<string, string> = {
  evenement: "#EA580C",
  reunion: "#3B82F6",
  rappel: "#DB2777",
  conge: "#9CA3AF",
  autre: "#9CA3AF",
}
const MANUAL_EVENT_DEFAULT_COLOR = "#9CA3AF"

const DEFAULT_COLOR = "#6B7280"
const TACHE_NORMALE_COLOR = "#4F46E5"
const TACHE_RETARD_COLOR = "#EF4444"

function getFormationColor(title: string, index: number): string {
  const match = title.match(/(\d+)/)
  const num = match ? parseInt(match[1], 10) : index + 1
  return num % 2 === 0 ? FORMATION_EVEN_COLOR : FORMATION_ODD_COLOR
}

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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [projets, formations, taches, manualEvents] = await Promise.all([
      prisma.project.findMany({
        where: {
          date: { gte: start, lt: end },
          status: { notIn: ["archive", "perdu"] },
        },
        include: { client: { select: { name: true } } },
      }),
      prisma.trainingSession.findMany({
        where: {
          dateStart: { gte: start, lt: end },
          status: { not: "annule" },
        },
      }),
      prisma.task.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          completed: false,
        },
      }),
      prisma.calendarEvent.findMany({
        where: { date: { gte: start, lt: end } },
      }),
    ])

    const evenements: Evenement[] = []

    for (const p of projets) {
      if (!p.date) continue
      evenements.push({
        id: `projet-${p.id}`,
        title: p.title,
        date: p.date.toISOString(),
        type: "projet",
        subtype: p.type,
        status: p.status,
        clientName: p.client?.name,
        url: `/admin/projets/${p.id}`,
        color: TYPE_COLORS[p.type] ?? DEFAULT_COLOR,
      })
    }

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i]
      evenements.push({
        id: `formation-${f.id}`,
        title: f.title,
        date: f.dateStart.toISOString(),
        type: "formation",
        subtype: `formation_${f.status}`,
        status: f.status,
        url: `/admin/formations/${f.id}`,
        color: getFormationColor(f.title, i),
      })
    }

    for (const t of taches) {
      if (!t.dueDate) continue
      const enRetard = t.dueDate < today
      evenements.push({
        id: `tache-${t.id}`,
        title: t.title,
        date: t.dueDate.toISOString(),
        type: "tache",
        subtype: enRetard ? "tache_retard" : "tache",
        status: enRetard ? "en_retard" : "a_faire",
        url: "/admin/journal",
        color: enRetard ? TACHE_RETARD_COLOR : TACHE_NORMALE_COLOR,
      })
    }

    for (const e of manualEvents) {
      evenements.push({
        id: `evenement-${e.id}`,
        title: e.title,
        date: e.date.toISOString(),
        type: "evenement_manuel",
        subtype: e.type,
        status: e.type,
        url: "",
        color: MANUAL_EVENT_COLORS[e.type] ?? MANUAL_EVENT_DEFAULT_COLOR,
        manualId: e.id,
        createdBy: e.createdBy,
        notes: e.notes ?? undefined,
      })
    }

    evenements.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ evenements })
  } catch (error) {
    console.warn("[api/calendrier GET]", error)
    return NextResponse.json({ evenements: [] })
  }
}
