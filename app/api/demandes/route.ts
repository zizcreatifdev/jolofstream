import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { listQuoteRequests, toQuoteRequestView } from "@/lib/quote-requests-server"

export const dynamic = "force-dynamic"

// Liste des demandes de devis du site (filtres ?statut= et ?besoin=)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const rows = await listQuoteRequests({ status: searchParams.get("statut"), need: searchParams.get("besoin") })
    return NextResponse.json({ demandes: rows.map(toQuoteRequestView) })
  } catch (error) {
    console.error("[api/demandes GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
