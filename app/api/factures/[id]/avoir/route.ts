import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  )
}

// Avoir total : reprend la facture en negatif et annule la facture d'origine.
// Un seul avoir par facture (reference de la facture + "-AVOIR").
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lines: true },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      )
    }
    if (invoice.type === "avoir") {
      return NextResponse.json(
        { error: "On ne cree pas d'avoir sur un avoir." },
        { status: 409 }
      )
    }
    if (invoice.status === "annulee") {
      return NextResponse.json(
        {
          error:
            "Cette facture est deja annulee : un avoir ne peut plus etre emis.",
        },
        { status: 409 }
      )
    }

    // L'acompte reste la base du solde : on n'annule pas l'acompte tant qu'un
    // solde actif le deduit. Un avoir sur le solde, lui, le rend refacturable.
    if (invoice.type === "acompte" && invoice.quoteId) {
      const activeSolde = await prisma.invoice.findFirst({
        where: {
          quoteId: invoice.quoteId,
          type: "solde",
          status: { not: "annulee" },
        },
        select: { id: true },
      })
      if (activeSolde) {
        return NextResponse.json(
          { error: "Annulez d'abord la facture de solde." },
          { status: 409 }
        )
      }
    }

    const avoirReference = `${invoice.reference}-AVOIR`
    const alreadyExists = await prisma.invoice.findUnique({
      where: { reference: avoirReference },
      select: { id: true },
    })
    if (alreadyExists) {
      return NextResponse.json(
        { error: `Un avoir existe deja pour cette facture (${avoirReference}).` },
        { status: 409 }
      )
    }

    const subject = invoice.subject
      ? `Avoir sur ${invoice.reference} : ${invoice.subject}`
      : `Avoir sur ${invoice.reference}`

    const avoir = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          reference: avoirReference,
          clientId: invoice.clientId,
          projectId: invoice.projectId,
          quoteId: invoice.quoteId,
          subject,
          type: "avoir",
          status: "emise",
          brsEnabled: invoice.brsEnabled,
          tvaEnabled: invoice.tvaEnabled,
          subtotalHt: -invoice.subtotalHt,
          brsAmount: -invoice.brsAmount,
          tvaAmount: -invoice.tvaAmount,
          totalTtc: -invoice.totalTtc,
          issuedAt: new Date(),
          notes: `Avoir sur facture ${invoice.reference}`,
          createdBy: session.user.id,
          lines: {
            create: invoice.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: -l.unitPrice,
              total: -l.total,
            })),
          },
        },
        include: { lines: true, client: true },
      })

      // Seul le statut change : paidAt est conserve pour l'historique, la
      // facture sort des recettes puisque son statut n'est plus "payee"
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "annulee" },
      })

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entityType: "Invoice",
          entityId: created.id,
          description: `Avoir ${created.reference} emis, facture ${invoice.reference} annulee`,
        },
      })

      return created
    })

    return NextResponse.json(avoir, { status: 201 })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Un avoir existe deja pour cette facture." },
        { status: 409 }
      )
    }
    console.error("[api/factures/:id/avoir]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
