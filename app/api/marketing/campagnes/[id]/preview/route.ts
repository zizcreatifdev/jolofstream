import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderCampaignHtml } from "@/lib/campaign-templates"

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
      select: { subject: true, body: true },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }
    const html = renderCampaignHtml({
      subject: campagne.subject,
      body: campagne.body,
    })
    return NextResponse.json({ html })
  } catch (error) {
    console.warn("[api/marketing/campagnes/[id]/preview]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
