import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Evenement = {
  id: string
  title: string
  date: string
  type: "projet" | "formation" | "tache"
  status: string
  clientName?: string
  url: string
  color: string
}

const PROJECT_COLORS: Record<string, string> = {
  confirme: "#C8151B",
  en_cours: "#F5B800",
  prospect: "#6B7280",
  livre: "#10B981",
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

    const [projets, formations, taches] = await Promise.all([
      prisma.project.findMany({
        where: {
          date: { gte: start, lt: end },
          status: { notIn: ["archive", "perdu"] },
        },
        include: { client: { select: { name: true } } },
      }),
      prisma.trainingSession.findMany({
        where: { dateStart: { gte: start, lt: end } },
      }),
      prisma.task.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          completed: false,
        },
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
        status: p.status,
        clientName: p.client?.name,
        url: `/admin/projets/${p.id}`,
        color: PROJECT_COLORS[p.status] ?? "#6B7280",
      })
    }

    for (const f of formations) {
      evenements.push({
        id: `formation-${f.id}`,
        title: f.title,
        date: f.dateStart.toISOString(),
        type: "formation",
        status: f.status,
        url: `/admin/formations/${f.id}`,
        color: "#8B5CF6",
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
        status: enRetard ? "en_retard" : "a_faire",
        url: "/admin/journal",
        color: enRetard ? "#EF4444" : "#3B82F6",
      })
    }

    evenements.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ evenements })
  } catch (error) {
    console.warn("[api/calendrier GET]", error)
    return NextResponse.json({ evenements: [] })
  }
}
