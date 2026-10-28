import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  buildTwelveMonthsSeries,
  filterRecettes,
  loadRecettes,
  sumRecettes,
} from "@/lib/comptabilite"

type MonthlyRevenue = { mois: string; ca: number }

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
      recettes12Mois,
      projetsEnCours,
      facturesImpayees,
      inscriptionsEnAttente,
      leadsSemaine,
    ] = await Promise.all([
      // Definition unique des recettes (factures, avoirs, formations)
      loadRecettes(prisma, { gte: start12Months, lt: endCurrentMonth }),
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
    ])

    const recettesMoisCourant = sumRecettes(
      filterRecettes(recettes12Mois, {
        gte: startCurrentMonth,
        lt: endCurrentMonth,
      })
    )
    const recettesMoisPrecedent = sumRecettes(
      filterRecettes(recettes12Mois, {
        gte: startPreviousMonth,
        lt: endPreviousMonth,
      })
    )

    // Serie 12 mois (un avoir sur facture payee compte dans son mois d'emission)
    const series: MonthlyRevenue[] = buildTwelveMonthsSeries(
      recettes12Mois,
      (e) => e.totalTtc,
      (e) => e.date,
      now
    ).map((p) => ({ mois: p.mois, ca: p.montant }))

    return NextResponse.json({
      ca_mois_courant: recettesMoisCourant,
      ca_mois_precedent: recettesMoisPrecedent,
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
