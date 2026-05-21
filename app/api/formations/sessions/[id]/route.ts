import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  dateStart: z.string().trim().min(1).optional(),
  dateEnd: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  maxSeats: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive().optional(),
  description: z.string().optional().or(z.literal("")).nullable(),
  status: z.enum(["ouvert", "complet", "annule"]).optional(),
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
    const record = await prisma.trainingSession.findUnique({
      where: { id: params.id },
      include: {
        registrations: {
          orderBy: [
            { status: "asc" },
            { waitlistPosition: "asc" },
            { registeredAt: "asc" },
          ],
        },
      },
    })
    if (!record) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      )
    }

    const counts = {
      en_attente: 0,
      confirme: 0,
      liste_attente: 0,
      annule: 0,
    }
    for (const r of record.registrations) {
      const key = r.status as keyof typeof counts
      if (key in counts) counts[key]++
    }
    const occupied = counts.en_attente + counts.confirme
    const remaining = Math.max(0, record.maxSeats - occupied)

    return NextResponse.json({ ...record, counts, remaining })
  } catch (error) {
    console.error("[api/formations/sessions/:id GET]", error)
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
    const data = updateSchema.parse(body)

    const existing = await prisma.trainingSession.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            registrations: { where: { status: "confirme" } },
          },
        },
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      )
    }

    if (
      data.maxSeats !== undefined &&
      data.maxSeats < existing._count.registrations
    ) {
      return NextResponse.json(
        {
          error: `Impossible de reduire le nombre de places en dessous de ${existing._count.registrations} (inscrits confirmes).`,
        },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.dateStart !== undefined)
      updateData.dateStart = new Date(data.dateStart)
    if (data.dateEnd !== undefined)
      updateData.dateEnd = new Date(data.dateEnd)
    if (data.location !== undefined) updateData.location = data.location
    if (data.maxSeats !== undefined) updateData.maxSeats = data.maxSeats
    if (data.price !== undefined) updateData.price = data.price
    if (data.description !== undefined)
      updateData.description = data.description || null
    if (data.status !== undefined) updateData.status = data.status

    const updated = await prisma.trainingSession.update({
      where: { id: params.id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingSession",
        entityId: updated.id,
        description: `Session modifiee : ${updated.title}`,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/sessions/:id PATCH]", error)
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
    const record = await prisma.trainingSession.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            registrations: { where: { status: "confirme" } },
          },
        },
      },
    })
    if (!record) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      )
    }
    if (record._count.registrations > 0) {
      return NextResponse.json(
        {
          error:
            "Suppression impossible : des inscriptions confirmees sont liees a cette session. Annulez la session a la place.",
        },
        { status: 403 }
      )
    }

    await prisma.$transaction([
      prisma.trainingRegistration.deleteMany({
        where: { sessionId: params.id },
      }),
      prisma.trainingSession.delete({ where: { id: params.id } }),
    ])

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "TrainingSession",
        entityId: params.id,
        description: `Session supprimee : ${record.title}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/formations/sessions/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
