import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { notifyAllAdmins } from "@/lib/notifications"
import {
  cohortDisplayName,
  formatDeadline,
  formatPrice,
  holdDeadline,
} from "@/lib/formations"
import {
  SESSION_EMAIL_INCLUDE,
  buildFormationEmailDetails,
  cohortDatesText,
  getWaveTemplate,
} from "@/lib/formation-emails"
import { getPaymentDelayHours } from "@/lib/training-delay"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"
import ConfirmationPaiementEmail from "@/emails/confirmation-paiement-formation"
import ListeAttentePromueEmail from "@/emails/liste-attente-promue"
import RelancePaiementFormationEmail from "@/emails/relance-paiement-formation"

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirmer"),
    amountPaid: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === "" || v === null) return undefined
        const num = typeof v === "string" ? Number(v) : v
        return Number.isFinite(num) && num >= 0 ? num : undefined
      }),
  }),
  z.object({ action: z.literal("annuler") }),
  z.object({ action: z.literal("mettre_en_attente") }),
  // Delai de paiement (reservations en attente uniquement)
  z.object({ action: z.literal("relancer") }),
  z.object({ action: z.literal("prolonger"), hours: z.union([z.literal(24), z.literal(48)]) }),
  z.object({ action: z.literal("liberer") }),
])

const HOLD_ACTIONS = new Set(["relancer", "prolonger", "liberer"])

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const record = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: {
        session: {
          select: { id: true, title: true, price: true, maxSeats: true },
        },
      },
    })
    if (!record) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error("[api/formations/inscriptions/:id GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const input = actionSchema.parse(body)
    const action = input.action

    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: { session: { include: SESSION_EMAIL_INCLUDE } },
    })
    if (!registration) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      )
    }
    const cohortName = cohortDisplayName(registration.session)
    const person = `${registration.firstName} ${registration.lastName}`

    if (HOLD_ACTIONS.has(action) && registration.status !== "en_attente") {
      return NextResponse.json(
        { error: "Action réservée aux inscriptions en attente de paiement." },
        { status: 400 }
      )
    }

    // Relancer : email d'abord, puis nouvelle echeance (D-129). Si l'email
    // echoue, rien ne change.
    if (input.action === "relancer") {
      const delay = await getPaymentDelayHours()
      const deadline = holdDeadline(delay)
      const details = buildFormationEmailDetails(registration.session, {
        firstName: registration.firstName,
        deadline,
        waveTemplate: await getWaveTemplate(),
      })
      const sent = await sendEmail({
        to: registration.email,
        subject: `Votre place vous attend : ${cohortName}`,
        react: RelancePaiementFormationEmail(details),
      })
      if (!sent.success) {
        return NextResponse.json(
          {
            error: `L'email de relance n'a pas pu être envoyé (${sent.error ?? "erreur inconnue"}). Aucune modification.`,
          },
          { status: 502 }
        )
      }
      const updated = await prisma.trainingRegistration.update({
        where: { id: params.id },
        data: { holdExpiresAt: deadline },
      })
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "TrainingRegistration",
          entityId: updated.id,
          description: `Relance de paiement envoyée : ${person} pour ${cohortName}, nouveau délai jusqu'au ${formatDeadline(deadline)}`,
        },
      })
      revalidateSite(FORMATION_PATHS)
      return NextResponse.json(updated)
    }

    // Prolonger : +24 h ou +48 h, sans email. Depuis l'echeance actuelle, ou
    // depuis maintenant si elle est deja passee.
    if (input.action === "prolonger") {
      const now = Date.now()
      const current = registration.holdExpiresAt?.getTime() ?? now
      const deadline = holdDeadline(input.hours, new Date(Math.max(now, current)))
      const updated = await prisma.trainingRegistration.update({
        where: { id: params.id },
        data: { holdExpiresAt: deadline },
      })
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "TrainingRegistration",
          entityId: updated.id,
          description: `Délai de paiement prolongé de ${input.hours} h : ${person} pour ${cohortName}, jusqu'au ${formatDeadline(deadline)}`,
        },
      })
      revalidateSite(FORMATION_PATHS)
      return NextResponse.json(updated)
    }

    if (input.action === "confirmer") {
      if (registration.status === "confirme") {
        return NextResponse.json(registration)
      }
      const confirmedCount = await prisma.trainingRegistration.count({
        where: {
          sessionId: registration.sessionId,
          status: "confirme",
        },
      })
      if (confirmedCount >= registration.session.maxSeats) {
        return NextResponse.json(
          {
            error:
              "La session est déjà pleine. Impossible de confirmer une inscription supplémentaire.",
          },
          { status: 400 }
        )
      }

      const montantPaye =
        input.amountPaid !== undefined ? input.amountPaid : registration.session.price
      const [updated] = await prisma.$transaction([
        prisma.trainingRegistration.update({
          where: { id: params.id },
          data: {
            status: "confirme",
            confirmedAt: new Date(),
            waitlistPosition: null,
            amountPaid: montantPaye,
          },
        }),
        ...(confirmedCount + 1 >= registration.session.maxSeats
          ? [
              prisma.trainingSession.update({
                where: { id: registration.sessionId },
                data: { status: "complet" },
              }),
            ]
          : []),
      ])

      const isPartial = montantPaye < registration.session.price
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "TrainingRegistration",
          entityId: updated.id,
          description: isPartial
            ? `Acompte encaissé : ${updated.firstName} ${updated.lastName} pour ${cohortName} (${formatPrice(montantPaye)} / ${formatPrice(registration.session.price)})`
            : `Inscription confirmée : ${updated.firstName} ${updated.lastName} pour ${cohortName}`,
        },
      })

      // Email de confirmation paiement (echec non bloquant)
      try {
        await sendEmail({
          to: updated.email,
          subject: `Paiement confirmé : ${cohortName}`,
          react: ConfirmationPaiementEmail({
            firstName: updated.firstName,
            sessionTitle: cohortName,
            sessionDate: cohortDatesText(registration.session),
            sessionLocation: registration.session.location,
          }),
        })
      } catch (e) {
        console.warn("[api/formations/inscriptions confirmer] email echoue", e)
      }

      try {
        await notifyAllAdmins({
          type: "paiement_confirme",
          title: "Paiement confirmé",
          message: `Paiement confirmé pour ${updated.firstName} ${updated.lastName} (${cohortName})`,
          entityType: "TrainingRegistration",
          entityId: params.id,
          entityUrl: `/admin/formations/${registration.sessionId}`,
        })
      } catch (e) {
        console.warn("[api/formations/inscriptions confirmer] notifications echec", e)
      }

      revalidateSite(FORMATION_PATHS)
      return NextResponse.json(updated)
    }

    if (input.action === "mettre_en_attente") {
      // Nouvelle echeance de paiement a partir de maintenant
      const delay = await getPaymentDelayHours()
      const updated = await prisma.trainingRegistration.update({
        where: { id: params.id },
        data: {
          status: "en_attente",
          confirmedAt: null,
          holdExpiresAt: holdDeadline(delay),
        },
      })

      if (registration.session.status === "complet") {
        await prisma.trainingSession.update({
          where: { id: registration.sessionId },
          data: { status: "ouvert" },
        })
      }

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "TrainingRegistration",
          entityId: updated.id,
          description: `Inscription remise en attente : ${updated.firstName} ${updated.lastName} (${cohortName})`,
        },
      })

      revalidateSite(FORMATION_PATHS)
      return NextResponse.json(updated)
    }

    // action "annuler" ou "liberer" (meme parcours : la place liberee est
    // proposee a la liste d'attente avec un nouveau delai)
    const releasing = input.action === "liberer"
    const wasOccupying =
      registration.status === "confirme" ||
      registration.status === "en_attente"

    const updated = await prisma.trainingRegistration.update({
      where: { id: params.id },
      data: { status: "annule", waitlistPosition: null },
    })

    let promoted: { id: string; firstName: string; lastName: string } | null =
      null

    if (wasOccupying) {
      const next = await prisma.trainingRegistration.findFirst({
        where: {
          sessionId: registration.sessionId,
          status: "liste_attente",
        },
        orderBy: [{ waitlistPosition: "asc" }, { registeredAt: "asc" }],
      })
      if (next) {
        const delay = await getPaymentDelayHours()
        const deadline = holdDeadline(delay)
        await prisma.$transaction(async (tx) => {
          await tx.trainingRegistration.update({
            where: { id: next.id },
            data: { status: "en_attente", waitlistPosition: null, holdExpiresAt: deadline },
          })
          // Decrementer les autres en liste d'attente
          const others = await tx.trainingRegistration.findMany({
            where: {
              sessionId: registration.sessionId,
              status: "liste_attente",
            },
            orderBy: { waitlistPosition: "asc" },
          })
          for (let i = 0; i < others.length; i++) {
            await tx.trainingRegistration.update({
              where: { id: others[i].id },
              data: { waitlistPosition: i + 1 },
            })
          }
        })
        promoted = {
          id: next.id,
          firstName: next.firstName,
          lastName: next.lastName,
        }

        // Email de promotion liste d'attente (echec non bloquant)
        try {
          await sendEmail({
            to: next.email,
            subject: `Une place s'est libérée : ${cohortName}`,
            react: ListeAttentePromueEmail(
              buildFormationEmailDetails(registration.session, {
                firstName: next.firstName,
                deadline,
                waveTemplate: await getWaveTemplate(),
              })
            ),
          })
        } catch (e) {
          console.warn(
            "[api/formations/inscriptions promotion] email echoue",
            e
          )
        }
      }

      if (registration.session.status === "complet") {
        await prisma.trainingSession.update({
          where: { id: registration.sessionId },
          data: { status: "ouvert" },
        })
      }
    }

    const head = releasing
      ? `Place libérée (délai de paiement dépassé) : ${updated.firstName} ${updated.lastName}, ${cohortName}`
      : `Inscription annulée : ${updated.firstName} ${updated.lastName} (${cohortName})`
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingRegistration",
        entityId: updated.id,
        description: promoted
          ? `${head}. ${promoted.firstName} ${promoted.lastName} promu(e) depuis la liste d'attente`
          : head,
      },
    })

    revalidateSite(FORMATION_PATHS)
    return NextResponse.json({ ...updated, promoted })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/inscriptions/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
