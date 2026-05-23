import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type StatsResponse = {
  destinataires: number
  envoyes: number
  ouverts: number
  ouverts_uniques: number
  taux_ouverture: number
  cliques: number
  cliques_uniques: number
  taux_clic: number
  desabonnes: number
  series: Array<{ jour: string; ouvertures: number; clics: number }>
}

const empty: StatsResponse = {
  destinataires: 0,
  envoyes: 0,
  ouverts: 0,
  ouverts_uniques: 0,
  taux_ouverture: 0,
  cliques: 0,
  cliques_uniques: 0,
  taux_clic: 0,
  desabonnes: 0,
  series: [],
}

function formatDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const campagne = await prisma.marketingCampaign.findUnique({
      where: { id: params.id },
      select: { lists: true, sentAt: true },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }

    const [
      destinataires,
      opensCount,
      clicksCount,
      desabonnes,
      uniqueOpens,
      uniqueClicks,
      opensRows,
      clicksRows,
    ] = await Promise.all([
      campagne.lists.length === 0
        ? Promise.resolve(0)
        : prisma.marketingContact.count({
            where: {
              unsubscribed: false,
              lists: { hasSome: campagne.lists },
            },
          }),
      prisma.campaignOpen.count({ where: { campaignId: params.id } }),
      prisma.campaignClick.count({ where: { campaignId: params.id } }),
      campagne.lists.length === 0
        ? Promise.resolve(0)
        : prisma.marketingContact.count({
            where: {
              unsubscribed: true,
              lists: { hasSome: campagne.lists },
            },
          }),
      prisma.campaignOpen.groupBy({
        by: ["contactEmail"],
        where: { campaignId: params.id },
      }),
      prisma.campaignClick.groupBy({
        by: ["contactEmail"],
        where: { campaignId: params.id },
      }),
      prisma.campaignOpen.findMany({
        where: { campaignId: params.id },
        select: { openedAt: true },
      }),
      prisma.campaignClick.findMany({
        where: { campaignId: params.id },
        select: { clickedAt: true },
      }),
    ])

    const envoyes = campagne.sentAt ? destinataires : 0
    const ouvertsUniques = uniqueOpens.length
    const cliquesUniques = uniqueClicks.length
    const tauxOuverture =
      envoyes > 0 ? Math.round((ouvertsUniques / envoyes) * 100) : 0
    const tauxClic =
      envoyes > 0 ? Math.round((cliquesUniques / envoyes) * 100) : 0

    // Series 14 derniers jours
    const now = new Date()
    const days = 14
    const map = new Map<string, { ouvertures: number; clics: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      map.set(formatDayKey(d), { ouvertures: 0, clics: 0 })
    }
    for (const o of opensRows) {
      const k = formatDayKey(o.openedAt)
      const v = map.get(k)
      if (v) v.ouvertures += 1
    }
    for (const c of clicksRows) {
      const k = formatDayKey(c.clickedAt)
      const v = map.get(k)
      if (v) v.clics += 1
    }
    const series = Array.from(map.entries()).map(([jour, v]) => ({
      jour,
      ouvertures: v.ouvertures,
      clics: v.clics,
    }))

    const response: StatsResponse = {
      destinataires,
      envoyes,
      ouverts: opensCount,
      ouverts_uniques: ouvertsUniques,
      taux_ouverture: tauxOuverture,
      cliques: clicksCount,
      cliques_uniques: cliquesUniques,
      taux_clic: tauxClic,
      desabonnes,
      series,
    }
    return NextResponse.json(response)
  } catch (error) {
    console.warn("[api/marketing/campagnes/[id]/stats]", error)
    return NextResponse.json(empty)
  }
}
