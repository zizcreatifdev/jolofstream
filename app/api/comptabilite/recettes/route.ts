import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  loadRecettes,
  type DateRange,
  type RecetteSource,
} from "@/lib/comptabilite"

type RecetteRow = {
  id: string
  reference: string
  totalTtc: number
  // Date d'encaissement : paiement (facture, formation) ou emission (avoir)
  paidAt: string
  issuedAt: string | null
  client: { id: string; name: string } | null
  project: { id: string; title: string } | null
  source: RecetteSource
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )
    const clientId = searchParams.get("clientId") ?? ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const range: DateRange = {}
    if (dateFrom) range.gte = new Date(dateFrom)
    if (dateTo) range.lte = new Date(dateTo)

    // Definition unique des recettes ; sans formations si un client est filtre
    const entries = await loadRecettes(prisma, range, {
      clientId: clientId || undefined,
    })

    const all: RecetteRow[] = entries
      .map((e) => ({
        id: e.id,
        reference: e.reference,
        totalTtc: e.totalTtc,
        paidAt: e.date.toISOString(),
        issuedAt: e.issuedAt ? e.issuedAt.toISOString() : null,
        client:
          e.source === "formation"
            ? { id: e.id, name: e.clientName }
            : e.clientId
              ? { id: e.clientId, name: e.clientName }
              : null,
        project:
          e.projectId && e.projectTitle
            ? { id: e.projectId, title: e.projectTitle }
            : null,
        source: e.source,
      }))
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      )

    const total = all.length
    const pages = Math.max(1, Math.ceil(total / limit))
    const slice = all.slice((page - 1) * limit, page * limit)
    const totalMontant = all.reduce((s, r) => s + r.totalTtc, 0)

    return NextResponse.json({
      recettes: slice,
      total,
      pages,
      totalMontant,
    })
  } catch (error) {
    console.warn("[api/comptabilite/recettes GET]", error)
    return NextResponse.json({
      recettes: [],
      total: 0,
      pages: 1,
      totalMontant: 0,
    })
  }
}
