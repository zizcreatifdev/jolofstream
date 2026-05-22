import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { formatPrice, formatSessionDate } from "@/lib/formations"
import ConfirmationPaiementEmail from "@/emails/confirmation-paiement-formation"
import ListeAttentePromueEmail from "@/emails/liste-attente-promue"

function buildWaveLink(template: string | null, amount: number): string | undefined {
  if (!template) return undefined
  return template.replace(/{montant}/g, String(amount))
}

const actionSchema = z.object({
  action: z.enum(["confirmer", "annuler", "mettre_en_attente"]),
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
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = actionSchema.parse(body)

    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: { session: true },
    })
    if (!registration) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      )
    }

    if (action === "confirmer") {
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
              "La session est deja pleine. Impossible de confirmer une inscription supplementaire.",
          },
          { status: 400 }
        )
      }

      const [updated] = await prisma.$transaction([
        prisma.trainingRegistration.update({
          where: { id: params.id },
          data: {
            status: "confirme",
            confirmedAt: new Date(),
            waitlistPosition: null,
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

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "TrainingRegistration",
          entityId: updated.id,
          description: `Inscription confirmee : ${updated.firstName} ${updated.lastName} pour ${registration.session.title}`,
        },
      })

      // Email de confirmation paiement (echec non bloquant)
      try {
        await sendEmail({
          to: updated.email,
          subject: `Paiement confirme - ${registration.session.title}`,
          react: ConfirmationPaiementEmail({
            firstName: updated.firstName,
            sessionTitle: registration.session.title,
            sessionDate: formatSessionDate(
              registration.session.dateStart,
              registration.session.dateEnd
            ),
            sessionLocation: registration.session.location,
          }),
        })
      } catch (e) {
        console.warn("[api/formations/inscriptions confirmer] email echoue", e)
      }

      return NextResponse.json(updated)
    }

    if (action === "mettre_en_attente") {
      const updated = await prisma.trainingRegistration.update({
        where: { id: params.id },
        data: {
          status: "en_attente",
          confirmedAt: null,
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
          description: `Inscription remise en attente : ${updated.firstName} ${updated.lastName}`,
        },
      })

      return NextResponse.json(updated)
    }

    // action === "annuler"
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
      // Email automatique a implementer au Prompt 12 (notification de place liberee)
      const next = await prisma.trainingRegistration.findFirst({
        where: {
          sessionId: registration.sessionId,
          status: "liste_attente",
        },
        orderBy: [{ waitlistPosition: "asc" }, { registeredAt: "asc" }],
      })
      if (next) {
        await prisma.$transaction(async (tx) => {
          await tx.trainingRegistration.update({
            where: { id: next.id },
            data: { status: "en_attente", waitlistPosition: null },
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
          const waveTemplate = await prisma.setting.findUnique({
            where: { key: "company_wave_link_template" },
          })
          const waveLink = buildWaveLink(
            waveTemplate?.value ?? null,
            registration.session.price
          )
          await sendEmail({
            to: next.email,
            subject: `Une place s'est liberee - ${registration.session.title}`,
            react: ListeAttentePromueEmail({
              firstName: next.firstName,
              sessionTitle: registration.session.title,
              sessionDate: formatSessionDate(
                registration.session.dateStart,
                registration.session.dateEnd
              ),
              sessionLocation: registration.session.location,
              price: formatPrice(registration.session.price),
              waveLink,
            }),
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

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingRegistration",
        entityId: updated.id,
        description: promoted
          ? `Inscription annulee : ${updated.firstName} ${updated.lastName} - Place liberee, ${promoted.firstName} ${promoted.lastName} notifie (liste d'attente)`
          : `Inscription annulee : ${updated.firstName} ${updated.lastName}`,
      },
    })

    return NextResponse.json({ ...updated, promoted })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/inscriptions/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
