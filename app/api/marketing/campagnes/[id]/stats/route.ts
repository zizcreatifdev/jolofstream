import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      select: { lists: true },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }
    const destinataires =
      campagne.lists.length === 0
        ? 0
        : await prisma.marketingContact.count({
            where: {
              unsubscribed: false,
              lists: { hasSome: campagne.lists },
            },
          })

    return NextResponse.json({
      destinataires,
      envoyes: 0,
      ouverts: 0,
      cliques: 0,
      desabonnes: 0,
    })
  } catch (error) {
    console.warn("[api/marketing/campagnes/[id]/stats]", error)
    return NextResponse.json({
      destinataires: 0,
      envoyes: 0,
      ouverts: 0,
      cliques: 0,
      desabonnes: 0,
    })
  }
}
