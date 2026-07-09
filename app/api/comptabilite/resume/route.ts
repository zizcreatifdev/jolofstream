import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MONTH_LABELS } from "@/lib/comptabilite"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const empty = {
    recettes: {
      total: 0,
      ce_mois: 0,
      mois_precedent: 0,
      par_mois: [] as Array<{ mois: string; montant: number }>,
    },
    depenses: {
      total: 0,
      ce_mois: 0,
      par_mois: [] as Array<{ mois: string; montant: number }>,
      par_categorie: [] as Array<{ categorie: string; montant: number }>,
    },
    benefice: { total: 0, ce_mois: 0, marge: 0 },
    factures_impayees: {
      count: 0,
      total: 0,
      liste: [] as Array<{
        id: string
        reference: string
        client: string
        totalTtc: number
        dueAt: string | null
        joursRetard: number
      }>,
    },
  }

  try {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [
      facturesPayeesTotal,
      facturesPayees12m,
      facturesPayeesMois,
      facturesPayeesPrev,
      formationsTotal,
      formations12m,
      formationsMois,
      formationsPrev,
      depensesTotal,
      depensesMois,
      depenses12m,
      depensesParCat,
      facturesImpayees,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: { status: "payee", type: { not: "avoir" } },
      }),
      prisma.invoice.findMany({
        where: {
          status: "payee",
          type: { not: "avoir" },
          paidAt: { gte: start12 },
        },
        select: { totalTtc: true, paidAt: true },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          type: { not: "avoir" },
          paidAt: { gte: startMonth, lt: endMonth },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          type: { not: "avoir" },
          paidAt: { gte: startPrev, lt: startMonth },
        },
      }),
      prisma.trainingRegistration.findMany({
        where: { status: "confirme" },
        select: { amountPaid: true, session: { select: { price: true } } },
      }),
      prisma.trainingRegistration.findMany({
        where: { status: "confirme", confirmedAt: { gte: start12 } },
        select: {
          confirmedAt: true,
          amountPaid: true,
          session: { select: { price: true } },
        },
      }),
      prisma.trainingRegistration.findMany({
        where: {
          status: "confirme",
          confirmedAt: { gte: startMonth, lt: endMonth },
        },
        select: { amountPaid: true, session: { select: { price: true } } },
      }),
      prisma.trainingRegistration.findMany({
        where: {
          status: "confirme",
          confirmedAt: { gte: startPrev, lt: startMonth },
        },
        select: { amountPaid: true, session: { select: { price: true } } },
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startMonth, lt: endMonth } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: start12 } },
        select: { amount: true, date: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        _sum: { amount: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ["emise", "partiellement_payee"] },
          type: { not: "avoir" },
        },
        include: { client: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
      }),
    ])

    // Build 12-month series (recettes : factures + formations)
    const series: Array<{ mois: string; montant: number }> = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      series.push({ mois: MONTH_LABELS[d.getMonth()], montant: 0 })
    }
    for (const inv of facturesPayees12m) {
      if (!inv.paidAt) continue
      const monthsAgo =
        (now.getFullYear() - inv.paidAt.getFullYear()) * 12 +
        (now.getMonth() - inv.paidAt.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) series[idx].montant += inv.totalTtc
    }
    for (const f of formations12m) {
      if (!f.confirmedAt) continue
      const monthsAgo =
        (now.getFullYear() - f.confirmedAt.getFullYear()) * 12 +
        (now.getMonth() - f.confirmedAt.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) {
        series[idx].montant += f.amountPaid ?? f.session.price
      }
    }

    // Build 12-month series (depenses)
    const seriesDepenses: Array<{ mois: string; montant: number }> = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      seriesDepenses.push({ mois: MONTH_LABELS[d.getMonth()], montant: 0 })
    }
    for (const exp of depenses12m) {
      const monthsAgo =
        (now.getFullYear() - exp.date.getFullYear()) * 12 +
        (now.getMonth() - exp.date.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) seriesDepenses[idx].montant += exp.amount
    }

    const sumFormations = (
      rows: { amountPaid: number | null; session: { price: number } }[]
    ) => rows.reduce((s, r) => s + (r.amountPaid ?? r.session.price), 0)
    const recettesTotal =
      (facturesPayeesTotal._sum.totalTtc ?? 0) + sumFormations(formationsTotal)
    const recettesMois =
      (facturesPayeesMois._sum.totalTtc ?? 0) + sumFormations(formationsMois)
    const recettesPrev =
      (facturesPayeesPrev._sum.totalTtc ?? 0) + sumFormations(formationsPrev)
    const depTotal = depensesTotal._sum.amount ?? 0
    const depMois = depensesMois._sum.amount ?? 0
    const benefice = recettesTotal - depTotal
    const beneficeMois = recettesMois - depMois
    const marge = recettesTotal > 0 ? (benefice / recettesTotal) * 100 : 0

    const totalImpaye = facturesImpayees.reduce(
      (s, f) => s + f.totalTtc,
      0
    )
    const listeImpayes = facturesImpayees.map((f) => {
      const joursRetard = f.dueAt
        ? Math.max(
            0,
            Math.floor((now.getTime() - f.dueAt.getTime()) / (1000 * 60 * 60 * 24))
          )
        : 0
      return {
        id: f.id,
        reference: f.reference,
        client: f.client.name,
        totalTtc: f.totalTtc,
        dueAt: f.dueAt ? f.dueAt.toISOString() : null,
        joursRetard,
      }
    })

    return NextResponse.json({
      recettes: {
        total: recettesTotal,
        ce_mois: recettesMois,
        mois_precedent: recettesPrev,
        par_mois: series,
      },
      depenses: {
        total: depTotal,
        ce_mois: depMois,
        par_mois: seriesDepenses,
        par_categorie: depensesParCat.map((d) => ({
          categorie: d.category,
          montant: d._sum.amount ?? 0,
        })),
      },
      benefice: {
        total: benefice,
        ce_mois: beneficeMois,
        marge,
      },
      factures_impayees: {
        count: facturesImpayees.length,
        total: totalImpaye,
        liste: listeImpayes,
      },
    })
  } catch (error) {
    console.warn("[api/comptabilite/resume]", error)
    return NextResponse.json(empty)
  }
}
