import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { trainingRegistrationSchema } from "@/lib/schemas"
import { sendEmail } from "@/lib/email"
import { notifyAllAdmins } from "@/lib/notifications"
import { cohortDisplayName, holdDeadline } from "@/lib/formations"
import {
  SESSION_EMAIL_INCLUDE,
  buildFormationEmailDetails,
  getWaveTemplate,
} from "@/lib/formation-emails"
import { getPaymentDelayHours } from "@/lib/training-delay"
import ConfirmationInscriptionEmail from "@/emails/confirmation-inscription-formation"

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
      include: SESSION_EMAIL_INCLUDE,
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

    const cohortName = cohortDisplayName(session)
    // Echeance de paiement d'une place reservee (Parametres > Formations)
    const holdExpiresAt =
      status === "en_attente" ? holdDeadline(await getPaymentDelayHours()) : null

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
        holdExpiresAt,
      },
    })

    // Email de confirmation (echec non bloquant)
    try {
      const details = buildFormationEmailDetails(session, {
        firstName: data.firstName,
        deadline: holdExpiresAt,
        waveTemplate: await getWaveTemplate(),
      })
      const subject =
        status === "liste_attente"
          ? `Inscription enregistrée (liste d'attente) : ${cohortName}`
          : `Inscription enregistrée : ${cohortName}`
      await sendEmail({
        to: data.email,
        subject,
        react: ConfirmationInscriptionEmail({
          ...details,
          waitlisted: status === "liste_attente",
        }),
      })
    } catch (e) {
      console.warn("[api/formations/inscription] email echoue", e)
    }

    try {
      await notifyAllAdmins({
        type: "nouvelle_inscription",
        title: "Nouvelle inscription",
        message: `${data.firstName} ${data.lastName} s'est inscrit(e) à ${cohortName}`,
        entityType: "TrainingRegistration",
        entityId: registration.id,
        entityUrl: `/admin/formations/${data.sessionId}`,
      })
    } catch (e) {
      console.warn("[api/formations/inscription] notifications echec", e)
    }

    // Upsert client CRM (echec non bloquant)
    try {
      const existing = await prisma.client.findFirst({
        where: { email: data.email },
      })
      if (existing) {
        const mergedTags = Array.from(
          new Set([...(existing.tags ?? []), "formation"])
        )
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            phone: data.phone || existing.phone,
            tags: mergedTags,
          },
        })
      } else {
        await prisma.client.create({
          data: {
            type: "particulier",
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            status: "client",
            acquisitionChannel: "formation",
            tags: ["formation"],
            notes: `Inscrit via le site public - formation : ${cohortName}`,
          },
        })
      }
    } catch (e) {
      console.warn("[api/formations/inscription] upsert client CRM echec", e)
    }

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
