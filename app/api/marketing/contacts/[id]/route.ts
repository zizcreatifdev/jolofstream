import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  lists: z.array(z.string()).optional(),
  unsubscribed: z.boolean().optional(),
  clientId: z.string().optional().nullable(),
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
    const contact = await prisma.marketingContact.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, name: true, organization: true } },
      },
    })
    if (!contact) {
      return NextResponse.json(
        { error: "Contact introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(contact)
  } catch (error) {
    console.warn("[api/marketing/contacts/[id] GET]", error)
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

    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined)
      updateData.firstName = data.firstName?.trim() || null
    if (data.lastName !== undefined)
      updateData.lastName = data.lastName?.trim() || null
    if (data.lists !== undefined) updateData.lists = data.lists
    if (data.unsubscribed !== undefined)
      updateData.unsubscribed = data.unsubscribed
    if (data.clientId !== undefined)
      updateData.clientId = data.clientId?.trim() || null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun changement" },
        { status: 400 }
      )
    }

    const contact = await prisma.marketingContact.update({
      where: { id: params.id },
      data: updateData,
    })

    if (data.unsubscribed !== undefined) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "MarketingContact",
          entityId: contact.id,
          description: data.unsubscribed
            ? `Contact ${contact.email} desabonne`
            : `Contact ${contact.email} reabonne`,
        },
      })
    }

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/contacts/[id] PATCH]", error)
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
    const contact = await prisma.marketingContact.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    })
    if (!contact) {
      return NextResponse.json(
        { error: "Contact introuvable" },
        { status: 404 }
      )
    }
    await prisma.marketingContact.delete({ where: { id: params.id } })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "MarketingContact",
        entityId: params.id,
        description: `Contact marketing supprime : ${contact.email}`,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/marketing/contacts/[id] DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
