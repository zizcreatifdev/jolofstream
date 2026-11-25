import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { countNewQuoteRequests } from "@/lib/quote-requests-server"

export const dynamic = "force-dynamic"

// Nombre de demandes « nouvelle » (pastille de la barre laterale)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  try {
    return NextResponse.json({ nouvelles: await countNewQuoteRequests() })
  } catch {
    return NextResponse.json({ nouvelles: 0 })
  }
}
