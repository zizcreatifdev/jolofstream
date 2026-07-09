import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    })
    if (!event) {
      return NextResponse.json(
        { error: "Evenement introuvable" },
        { status: 404 }
      )
    }
    if (event.createdBy !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Suppression reservee a la personne qui a cree cet evenement.",
        },
        { status: 403 }
      )
    }

    await prisma.calendarEvent.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "CalendarEvent",
        entityId: params.id,
        description: `Evenement calendrier supprime : ${event.title}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/calendrier/evenements/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
