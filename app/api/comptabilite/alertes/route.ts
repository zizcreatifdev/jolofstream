import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { formatAmount, formatDate } from "@/lib/documents"
import RelanceFactureEmail from "@/emails/relance-facture"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const now = new Date()
    const enRetard = await prisma.invoice.findMany({
      where: {
        status: { in: ["emise", "partiellement_payee"] },
        type: { not: "avoir" },
        dueAt: { lt: now },
      },
      include: { client: true },
      orderBy: { dueAt: "asc" },
    })

    const factures: Array<{
      reference: string
      client: string
      montant: number
      joursRetard: number
      emailEnvoye: boolean
    }> = []
    let alertesEnvoyees = 0

    for (const invoice of enRetard) {
      const joursRetard = invoice.dueAt
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() - invoice.dueAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0

      let emailEnvoye = false
      if (invoice.client.email) {
        const firstName =
          invoice.client.name.split(/\s+/)[0] || invoice.client.name
        try {
          const r = await sendEmail({
            to: invoice.client.email,
            subject: `Rappel : facture ${invoice.reference} en attente de reglement`,
            react: RelanceFactureEmail({
              clientFirstName: firstName,
              reference: invoice.reference,
              totalTtc: formatAmount(invoice.totalTtc),
              dueDate: invoice.dueAt ? formatDate(invoice.dueAt) : undefined,
              daysPastDue: joursRetard,
            }),
          })
          emailEnvoye = Boolean(r?.success)
          if (emailEnvoye) alertesEnvoyees += 1
        } catch (e) {
          console.warn("[alertes/sendEmail]", invoice.reference, e)
        }
      }

      try {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "UPDATE",
            entityType: "Invoice",
            entityId: invoice.id,
            description: `Alerte impayes envoyee pour facture ${invoice.reference} (${joursRetard}j de retard)`,
          },
        })
      } catch (e) {
        console.warn("[alertes/activityLog]", invoice.reference, e)
      }

      factures.push({
        reference: invoice.reference,
        client: invoice.client.name,
        montant: invoice.totalTtc,
        joursRetard,
        emailEnvoye,
      })
    }

    return NextResponse.json({
      alertes_envoyees: alertesEnvoyees,
      total_factures: factures.length,
      factures,
    })
  } catch (error) {
    console.error("[api/comptabilite/alertes]", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des alertes" },
      { status: 500 }
    )
  }
}
