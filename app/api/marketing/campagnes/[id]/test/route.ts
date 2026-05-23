import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { renderCampaignHtmlWithTracking } from "@/lib/campaign-templates"

const schema = z.object({
  email: z.string().email("Email invalide"),
})

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://jolofstream.com"
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { email } = schema.parse(body)
    const normalized = email.toLowerCase().trim()

    const campagne = await prisma.marketingCampaign.findUnique({
      where: { id: params.id },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }

    const html = renderCampaignHtmlWithTracking({
      body: campagne.body,
      subject: campagne.subject,
      campaignId: campagne.id,
      contactEmail: normalized,
      contactFirstName: null,
      contactLastName: null,
      baseUrl: getBaseUrl(),
    })

    const r = await sendEmail({
      to: normalized,
      subject: `[TEST] ${campagne.subject}`,
      html,
    })

    if (!r?.success) {
      return NextResponse.json(
        { error: r?.error || "Echec de l'envoi du test" },
        { status: 500 }
      )
    }

    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "MarketingCampaign",
          entityId: campagne.id,
          description: `Test campagne "${campagne.title}" envoye a ${normalized}`,
        },
      })
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, email: normalized })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/campagnes/[id]/test]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
