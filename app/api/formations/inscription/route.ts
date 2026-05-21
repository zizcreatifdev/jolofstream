import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { trainingRegistrationSchema } from "@/lib/schemas"

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide" },
      { status: 400 }
    )
  }

  const parsed = trainingRegistrationSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Donnees invalides",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: data.sessionId },
    })
    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable." },
        { status: 404 }
      )
    }
    if (session.status === "annule") {
      return NextResponse.json(
        { error: "Cette session a ete annulee." },
        { status: 400 }
      )
    }

    const occupiedCount = await prisma.trainingRegistration.count({
      where: {
        sessionId: data.sessionId,
        status: { in: ["en_attente", "confirme"] },
      },
    })

    let status: "en_attente" | "liste_attente" = "en_attente"
    let waitlistPosition: number | null = null

    if (occupiedCount >= session.maxSeats) {
      status = "liste_attente"
      const waiting = await prisma.trainingRegistration.count({
        where: { sessionId: data.sessionId, status: "liste_attente" },
      })
      waitlistPosition = waiting + 1
    }

    const registration = await prisma.trainingRegistration.create({
      data: {
        sessionId: data.sessionId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        message: data.message || null,
        status,
        waitlistPosition,
      },
    })

    return NextResponse.json({
      success: true,
      status,
      registrationId: registration.id,
    })
  } catch (error) {
    console.warn(
      "[api/formations/inscription] DB indisponible, donnees logguees uniquement",
      { data, error: error instanceof Error ? error.message : error }
    )
    return NextResponse.json({ success: true, dbSkipped: true })
  }
}
