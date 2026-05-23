import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CAMPAIGN_STATUS_KEYS } from "@/lib/campaign-templates"

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1).optional(),
  body: z.string().min(1).optional(),
  lists: z.array(z.string()).optional(),
  templateType: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  status: z.enum(CAMPAIGN_STATUS_KEYS as [string, ...string[]]).optional(),
})

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
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(campagne)
  } catch (error) {
    console.warn("[api/marketing/campagnes/[id] GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const data = patchSchema.parse(body)

    const existing = await prisma.marketingCampaign.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }
    if (existing.status === "envoye") {
      return NextResponse.json(
        { error: "Une campagne envoyee ne peut plus etre modifiee." },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.subject !== undefined) updateData.subject = data.subject
    if (data.body !== undefined) updateData.body = data.body
    if (data.lists !== undefined) updateData.lists = data.lists
    if (data.templateType !== undefined)
      updateData.templateType = data.templateType || null
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt
        ? new Date(data.scheduledAt)
        : null
    }
    if (data.status !== undefined) updateData.status = data.status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun changement" },
        { status: 400 }
      )
    }

    const campagne = await prisma.marketingCampaign.update({
      where: { id: params.id },
      data: updateData,
    })

    if (data.status && data.status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "MarketingCampaign",
          entityId: campagne.id,
          description: `Campagne "${campagne.title}" passee au statut ${data.status}`,
        },
      })
    }

    return NextResponse.json(campagne)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/campagnes/[id] PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
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
      select: { id: true, status: true, title: true },
    })
    if (!campagne) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }
    if (campagne.status !== "brouillon") {
      return NextResponse.json(
        {
          error:
            "Seules les campagnes au statut Brouillon peuvent etre supprimees.",
        },
        { status: 403 }
      )
    }
    await prisma.marketingCampaign.delete({ where: { id: params.id } })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "MarketingCampaign",
        entityId: params.id,
        description: `Campagne supprimee : ${campagne.title}`,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/marketing/campagnes/[id] DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
