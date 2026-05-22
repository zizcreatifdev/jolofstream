import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { formatAmount, formatDate } from "@/lib/documents"
import DevisEnvoyeEmail from "@/emails/devis-envoye"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { client: true },
    })
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }
    if (!quote.client.email) {
      return NextResponse.json(
        { error: "Le client n'a pas d'adresse email." },
        { status: 400 }
      )
    }

    if (quote.status === "brouillon") {
      await prisma.quote.update({
        where: { id: params.id },
        data: { status: "envoye" },
      })
    }

    const firstName = quote.client.name.split(/\s+/)[0] || quote.client.name

    const emailResult = await sendEmail({
      to: quote.client.email,
      subject: `Votre devis ${quote.reference} - Jolof Stream`,
      react: DevisEnvoyeEmail({
        clientFirstName: firstName,
        reference: quote.reference,
        subject: quote.subject,
        totalTtc: formatAmount(quote.totalTtc),
        validUntil: formatDate(quote.validUntil),
      }),
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Quote",
        entityId: quote.id,
        description: `Devis ${quote.reference} envoye par email a ${quote.client.email}`,
      },
    })

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    })
  } catch (error) {
    console.error("[api/devis/:id/envoyer]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
