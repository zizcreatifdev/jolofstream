import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
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
import { AVAILABILITY_MESSAGES, cohortAvailability } from "@/lib/formations-public"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"
import ConfirmationInscriptionEmail from "@/emails/confirmation-inscription-formation"

export const dynamic = "force-dynamic"

const ACTIVE_STATUSES = ["en_attente", "confirme", "liste_attente"]
const DUPLICATE_MESSAGE =
  "Vous avez déjà une réservation pour cette cohorte, vérifiez vos emails."

class DuplicateError extends Error {}

// Reservation d'une place : tunnel public /formations/reserver et ajout
// manuel depuis l'admin (session admin : les cohortes passees ou d'un
// programme masque restent possibles, pas de champ piege).
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const parsed = trainingRegistrationSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data
  const admin = Boolean(await getServerSession(authOptions).catch(() => null))

  // Champ piege rempli : reponse factice, rien n'est cree
  if (!admin && data.website && data.website.trim() !== "") {
    return NextResponse.json({ success: true, status: "en_attente", registrationId: null })
  }

  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: data.sessionId },
      include: SESSION_EMAIL_INCLUDE,
    })
    if (!session) {
      return NextResponse.json({ error: AVAILABILITY_MESSAGES.introuvable }, { status: 404 })
    }
    if (admin) {
      if (session.status === "annule") {
        return NextResponse.json({ error: AVAILABILITY_MESSAGES.annulee }, { status: 400 })
      }
    } else {
      const availability = cohortAvailability(session)
      if (!availability.ok) {
        return NextResponse.json({ error: AVAILABILITY_MESSAGES[availability.reason] }, { status: 400 })
      }
    }

    const email = data.email.toLowerCase()
    const delay = await getPaymentDelayHours()

    // Comptage des places et creation dans une transaction qui verrouille la
    // ligne de la cohorte : deux reservations simultanees pour la derniere
    // place donnent une reservation et une liste d'attente
    const registration = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "TrainingSession" WHERE "id" = ${session.id} FOR UPDATE`
      const duplicate = await tx.trainingRegistration.findFirst({
        where: {
          sessionId: session.id,
          email: { equals: email, mode: "insensitive" },
          status: { in: ACTIVE_STATUSES },
        },
        select: { id: true },
      })
      if (duplicate) throw new DuplicateError()

      const occupied = await tx.trainingRegistration.count({
        where: { sessionId: session.id, status: { in: ["en_attente", "confirme"] } },
      })
      const full = occupied >= session.maxSeats || session.status === "complet"
      let waitlistPosition: number | null = null
      if (full) {
        const waiting = await tx.trainingRegistration.count({
          where: { sessionId: session.id, status: "liste_attente" },
        })
        waitlistPosition = waiting + 1
      }
      return tx.trainingRegistration.create({
        data: {
          sessionId: session.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email,
          phone: data.phone,
          message: data.message || null,
          status: full ? "liste_attente" : "en_attente",
          waitlistPosition,
          // Echeance de paiement d'une place reservee (Parametres > Formations)
          holdExpiresAt: full ? null : holdDeadline(delay),
        },
      })
    })

    const waitlisted = registration.status === "liste_attente"
    const cohortName = cohortDisplayName(session)

    // Email de confirmation (echec non bloquant : la reservation est faite)
    try {
      const details = buildFormationEmailDetails(session, {
        firstName: data.firstName,
        deadline: registration.holdExpiresAt,
        waveTemplate: await getWaveTemplate(),
      })
      await sendEmail({
        to: email,
        subject: waitlisted
          ? `Inscription enregistrée (liste d'attente) : ${cohortName}`
          : `Inscription enregistrée : ${cohortName}`,
        react: ConfirmationInscriptionEmail({ ...details, waitlisted }),
      })
    } catch (e) {
      console.warn("[api/formations/inscription] email echoue", e)
    }

    try {
      await notifyAllAdmins({
        type: "nouvelle_inscription",
        title: "Nouvelle inscription",
        message: `${data.firstName} ${data.lastName} s'est inscrit(e) à ${cohortName}${waitlisted ? " (liste d'attente)" : ""}`,
        entityType: "TrainingRegistration",
        entityId: registration.id,
        entityUrl: `/admin/formations/${session.id}`,
      })
    } catch (e) {
      console.warn("[api/formations/inscription] notifications echec", e)
    }

    // Upsert client CRM (echec non bloquant)
    try {
      const existing = await prisma.client.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      })
      if (existing) {
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            phone: data.phone || existing.phone,
            tags: Array.from(new Set([...(existing.tags ?? []), "formation"])),
          },
        })
      } else {
        await prisma.client.create({
          data: {
            type: "particulier",
            name: `${data.firstName} ${data.lastName}`,
            email,
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

    // Places mises a jour sur le site
    try {
      revalidateSite(FORMATION_PATHS)
    } catch {
      // hors contexte de rendu
    }

    return NextResponse.json({
      success: true,
      status: registration.status,
      registrationId: registration.id,
      holdExpiresAt: registration.holdExpiresAt ? registration.holdExpiresAt.toISOString() : null,
      waitlistPosition: registration.waitlistPosition,
      email,
    })
  } catch (error) {
    if (error instanceof DuplicateError) {
      return NextResponse.json({ error: DUPLICATE_MESSAGE }, { status: 409 })
    }
    console.error("[api/formations/inscription]", error)
    return NextResponse.json(
      { error: "La réservation n'a pas pu être enregistrée. Réessayez dans un instant." },
      { status: 500 }
    )
  }
}
