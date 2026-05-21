import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  serviceType: z.enum(["ceo_content", "creator_weekend"]).optional(),
  name: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().nullable().optional(),
  priceLabel: z.string().trim().optional().or(z.literal("")).nullable(),
  features: z.array(z.string().trim().min(1)).min(1).optional(),
  isPopular: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  active: z.boolean().optional(),
})

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
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType
    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price
    if (data.priceLabel !== undefined)
      updateData.priceLabel = data.priceLabel || null
    if (data.features !== undefined) updateData.features = data.features
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder
    if (data.active !== undefined) updateData.active = data.active

    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Offer",
        entityId: offer.id,
        description: `Offre modifiee : ${offer.name}`,
      },
    })

    return NextResponse.json(offer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/catalogue/:id PATCH]", error)
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
    const offer = await prisma.offer.findUnique({ where: { id: params.id } })
    if (!offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 })
    }

    await prisma.offer.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Offer",
        entityId: params.id,
        description: `Offre supprimee : ${offer.name}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/catalogue/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
