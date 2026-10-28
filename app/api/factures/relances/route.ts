import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { formatAmount, formatDate } from "@/lib/documents"
import RelanceFactureEmail from "@/emails/relance-facture"

const schema = z.object({
  invoiceId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { invoiceId } = schema.parse(body)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      )
    }
    if (invoice.type === "avoir") {
      return NextResponse.json(
        { error: "Un avoir ne fait pas l'objet d'une relance." },
        { status: 400 }
      )
    }
    if (invoice.status === "payee") {
      return NextResponse.json(
        { error: "Cette facture est deja payee : aucune relance necessaire." },
        { status: 400 }
      )
    }
    if (invoice.status === "annulee") {
      return NextResponse.json(
        { error: "Cette facture est annulee : elle ne peut pas etre relancee." },
        { status: 400 }
      )
    }
    if (invoice.status !== "emise" && invoice.status !== "partiellement_payee") {
      return NextResponse.json(
        {
          error:
            "Seules les factures Emises ou Partiellement payees peuvent etre relancees.",
        },
        { status: 400 }
      )
    }
    const clientEmail = invoice.client.email
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Ce client n'a pas d'adresse email." },
        { status: 400 }
      )
    }

    let daysPastDue = 0
    if (invoice.dueAt) {
      const diff = Date.now() - invoice.dueAt.getTime()
      daysPastDue = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
    }

    const firstName =
      invoice.client.name.split(/\s+/)[0] || invoice.client.name

    const emailResult = await sendEmail({
      to: clientEmail,
      subject: `Rappel : facture ${invoice.reference} en attente de reglement`,
      react: RelanceFactureEmail({
        clientFirstName: firstName,
        reference: invoice.reference,
        totalTtc: formatAmount(invoice.totalTtc),
        dueDate: invoice.dueAt ? formatDate(invoice.dueAt) : undefined,
        daysPastDue,
      }),
    })

    if (!emailResult.success) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "Invoice",
          entityId: invoice.id,
          description: `Echec relance facture ${invoice.reference} a ${clientEmail} : ${emailResult.error ?? "erreur inconnue"}`,
        },
      })
      return NextResponse.json(
        {
          error: "Echec de la relance",
          details: emailResult.error ?? "erreur inconnue",
        },
        { status: 502 }
      )
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Invoice",
        entityId: invoice.id,
        description: `Relance envoyee pour facture ${invoice.reference} a ${clientEmail} (${daysPastDue}j de retard)`,
      },
    })

    return NextResponse.json({
      success: true,
      email: clientEmail,
      daysPastDue,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/factures/relances]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
