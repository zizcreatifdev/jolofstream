import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const empty = {
    derniers_leads: [],
    prochains_evenements: [],
    activite_recente: [],
    taches_du_jour: [],
  }

  try {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const [leads, evenements, activite, taches] = await Promise.all([
      prisma.client.findMany({
        where: { acquisitionChannel: "site_web" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          organization: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: {
          date: { gte: now },
          status: { in: ["confirme", "en_cours"] },
        },
        orderBy: { date: "asc" },
        take: 3,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          completed: false,
          OR: [{ dueDate: null }, { dueDate: { lte: endOfDay } }],
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 3,
        include: {
          assignee: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    return NextResponse.json({
      derniers_leads: leads,
      prochains_evenements: evenements,
      activite_recente: activite,
      taches_du_jour: taches,
    })
  } catch (error) {
    console.warn("[api/dashboard/recent] DB indisponible", error)
    return NextResponse.json(empty)
  }
}
