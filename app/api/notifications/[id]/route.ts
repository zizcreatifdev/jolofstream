import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({ read: z.boolean() })

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
    const { read } = schema.parse(body)

    const existing = await prisma.notification.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      )
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 })
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read },
    })
    return NextResponse.json(notification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/notifications/[id] PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
