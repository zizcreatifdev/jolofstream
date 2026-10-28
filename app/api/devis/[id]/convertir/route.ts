import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  ReferenceConflictError,
  SoldeMismatchError,
  acompteError,
  activeAcompte,
  computeAcompte,
  computeSolde,
  formatAmount,
  formatDate,
  hasActiveInvoice,
  nextReference,
  soldeBlocker,
  withReferenceRetry,
  type InvoiceDraft,
} from "@/lib/documents"
import { sendEmail } from "@/lib/email"
import FactureEmiseEmail from "@/emails/facture-emise"

const convertSchema = z
  .object({
    type: z.enum(["standard", "acompte", "solde"]).default("standard"),
    mode: z.enum(["percent", "amount"]).optional(),
    value: z.coerce.number().optional(),
    dueDate: z.string().optional().or(z.literal("")),
  })
  .refine((d) => d.type !== "acompte" || (d.mode && d.value !== undefined), {
    message: "Choisissez un pourcentage ou un montant pour l'acompte.",
    path: ["value"],
  })

class ConversionConflictError extends Error {}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { type, mode, value, dueDate } = convertSchema.parse(body)

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        invoices: {
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            subtotalHt: true,
            brsAmount: true,
            tvaAmount: true,
            totalTtc: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
    }

    // Brouillon de la facture selon le type ; le solde se facture sur un
    // devis deja converti, les deux autres types le convertissent
    let draft: InvoiceDraft
    if (type === "solde") {
      if (quote.status !== "converti") {
        return badRequest("Facturez d'abord un acompte")
      }
      const blocker = soldeBlocker(quote.invoices)
      if (blocker) {
        // Sans acompte actif : 400 ; solde ou standard deja actif : 409
        const hasAcompte = Boolean(activeAcompte(quote.invoices))
        return NextResponse.json(
          { error: blocker },
          { status: hasAcompte ? 409 : 400 }
        )
      }
      draft = computeSolde(quote, activeAcompte(quote.invoices)!)
    } else {
      // Devis converti dont toutes les factures sont annulees : refacturable
      if (quote.status === "converti" && hasActiveInvoice(quote.invoices)) {
        return NextResponse.json(
          { error: "Ce devis a deja ete converti en facture." },
          { status: 409 }
        )
      }
      if (quote.status !== "accepte" && quote.status !== "converti") {
        return NextResponse.json(
          { error: "Seuls les devis acceptes peuvent etre convertis." },
          { status: 403 }
        )
      }
      if (type === "acompte") {
        const invalid = acompteError(quote, mode!, value!)
        if (invalid) return badRequest(invalid)
        draft = computeAcompte(quote, mode!, value!)
      } else {
        draft = {
          brsEnabled: quote.brsEnabled,
          tvaEnabled: quote.tvaEnabled,
          subtotalHt: quote.subtotalHt,
          brsAmount: quote.brsAmount,
          tvaAmount: quote.tvaAmount,
          totalTtc: quote.totalTtc,
          lines: quote.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.total,
          })),
        }
      }
    }

    let rebilled = false

    const invoice = await withReferenceRetry(() =>
      prisma.$transaction(async (tx) => {
        rebilled = false
        // Verrou sur le devis : les controles ci-dessous sont refaits sur
        // l'etat verrouille, deux conversions simultanees ne peuvent passer
        await tx.$queryRaw`SELECT id FROM "Quote" WHERE id = ${quote.id} FOR UPDATE`
        const locked = await tx.quote.findUnique({
          where: { id: quote.id },
          select: { status: true },
        })
        const linked = await tx.invoice.findMany({
          where: { quoteId: quote.id },
          select: { type: true, status: true },
        })
        if (type === "solde") {
          const blocker = soldeBlocker(linked)
          if (blocker) throw new ConversionConflictError(blocker)
        } else if (locked?.status === "accepte") {
          await tx.quote.update({
            where: { id: quote.id },
            data: { status: "converti" },
          })
        } else if (locked?.status === "converti" && !hasActiveInvoice(linked)) {
          rebilled = true
        } else {
          throw new ConversionConflictError(
            "Ce devis a deja ete converti en facture."
          )
        }

        const reference = await nextReference(tx, "FAC")

        return tx.invoice.create({
          data: {
            reference,
            clientId: quote.clientId,
            projectId: quote.projectId,
            quoteId: quote.id,
            subject: quote.subject,
            type,
            status: "emise",
            brsEnabled: draft.brsEnabled,
            tvaEnabled: draft.tvaEnabled,
            subtotalHt: draft.subtotalHt,
            brsAmount: draft.brsAmount,
            tvaAmount: draft.tvaAmount,
            totalTtc: draft.totalTtc,
            issuedAt: new Date(),
            dueAt: dueDate ? new Date(dueDate) : null,
            notes: quote.notes,
            createdBy: session.user.id,
            lines: { create: draft.lines },
          },
          include: { lines: true, client: true, project: true },
        })
      })
    )

    if (rebilled) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "Quote",
          entityId: quote.id,
          description: `Refacturation du devis ${quote.reference} apres annulation des factures precedentes`,
        },
      })
    }

    const label =
      type === "acompte"
        ? "Facture d'acompte"
        : type === "solde"
          ? "Facture de solde"
          : "Facture"
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        description: `${label} ${invoice.reference} (${formatAmount(invoice.totalTtc)}) creee depuis ${quote.reference}`,
      },
    })

    // Email facture emise (echec non bloquant)
    try {
      const client = await prisma.client.findUnique({
        where: { id: invoice.clientId },
      })
      if (client?.email) {
        const settings = await prisma.setting.findMany({
          where: {
            key: {
              in: [
                "company_wave_number",
                "company_bank_name",
                "company_bank_iban",
              ],
            },
          },
        })
        const map: Record<string, string> = {}
        for (const s of settings) map[s.key] = s.value
        const bankInfo =
          map.company_bank_name && map.company_bank_iban
            ? `${map.company_bank_name} - ${map.company_bank_iban}`
            : undefined
        const firstName = client.name.split(/\s+/)[0] || client.name
        await sendEmail({
          to: client.email,
          subject: `Votre facture ${invoice.reference} - Jolof Stream`,
          react: FactureEmiseEmail({
            clientFirstName: firstName,
            reference: invoice.reference,
            subject: invoice.subject ?? undefined,
            totalTtc: formatAmount(invoice.totalTtc),
            dueDate: invoice.dueAt ? formatDate(invoice.dueAt) : undefined,
            waveNumber: map.company_wave_number || undefined,
            bankInfo,
          }),
        })
      }
    } catch (e) {
      console.warn("[api/devis/:id/convertir] email facture echoue", e)
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    if (error instanceof ConversionConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof SoldeMismatchError) {
      console.error("[api/devis/:id/convertir]", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (error instanceof ReferenceConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error("[api/devis/:id/convertir]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
