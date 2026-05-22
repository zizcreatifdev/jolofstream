import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type MonthlyRevenue = { mois: string; ca: number }

const FRENCH_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aout",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const empty = {
    ca_mois_courant: 0,
    ca_mois_precedent: 0,
    projets_en_cours: 0,
    factures_impayees_count: 0,
    factures_impayees_total: 0,
    inscriptions_en_attente: 0,
    leads_cette_semaine: 0,
    ca_par_mois: [] as MonthlyRevenue[],
  }

  try {
    const now = new Date()
    const startCurrentMonth = startOfMonth(now)
    const endCurrentMonth = endOfMonth(now)
    const startPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    )
    const endPreviousMonth = startCurrentMonth
    const start12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const weekStart = startOfWeek(now)

    const [
      caCurrent,
      caPrevious,
      projetsEnCours,
      facturesImpayees,
      inscriptionsEnAttente,
      leadsSemaine,
      facturesPour12Mois,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          paidAt: { gte: startCurrentMonth, lt: endCurrentMonth },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          paidAt: { gte: startPreviousMonth, lt: endPreviousMonth },
        },
      }),
      prisma.project.count({
        where: { status: { in: ["confirme", "en_cours"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        _count: true,
        where: {
          status: { in: ["emise", "partiellement_payee"] },
          type: { not: "avoir" },
        },
      }),
      prisma.trainingRegistration.count({
        where: { status: "en_attente" },
      }),
      prisma.client.count({
        where: {
          acquisitionChannel: "site_web",
          createdAt: { gte: weekStart },
        },
      }),
      prisma.invoice.findMany({
        where: {
          status: "payee",
          paidAt: { gte: start12Months },
          type: { not: "avoir" },
        },
        select: { totalTtc: true, paidAt: true },
      }),
    ])

    // Build 12-month series
    const series: MonthlyRevenue[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      series.push({ mois: FRENCH_MONTHS[d.getMonth()], ca: 0 })
    }
    for (const inv of facturesPour12Mois) {
      if (!inv.paidAt) continue
      const monthIndex = inv.paidAt.getMonth()
      const monthsAgo =
        (now.getFullYear() - inv.paidAt.getFullYear()) * 12 +
        (now.getMonth() - inv.paidAt.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) {
        series[idx].ca += inv.totalTtc
        // monthIndex used implicitly via FRENCH_MONTHS lookup above
        void monthIndex
      }
    }

    return NextResponse.json({
      ca_mois_courant: caCurrent._sum.totalTtc ?? 0,
      ca_mois_precedent: caPrevious._sum.totalTtc ?? 0,
      projets_en_cours: projetsEnCours,
      factures_impayees_count: facturesImpayees._count ?? 0,
      factures_impayees_total: facturesImpayees._sum.totalTtc ?? 0,
      inscriptions_en_attente: inscriptionsEnAttente,
      leads_cette_semaine: leadsSemaine,
      ca_par_mois: series,
    })
  } catch (error) {
    console.warn("[api/dashboard/kpis] DB indisponible", error)
    return NextResponse.json(empty)
  }
}
