import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { renderCampaignHtmlWithTracking } from "@/lib/campaign-templates"
import { sendPushToAllAdmins } from "@/lib/push-notifications"

// Resend plan gratuit : 100 emails/jour, 3000/mois.
// Plan Pro : 50 000/mois. Adapter BATCH_SIZE et quotas selon le plan.
const BATCH_SIZE = 50
const DELAY_BETWEEN_BATCHES_MS = 1000

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://jolofstream.com"
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const campagne = await prisma.marketingCampaign.findUnique({
    where: { id: params.id },
  })
  if (!campagne) {
    return NextResponse.json(
      { error: "Campagne introuvable" },
      { status: 404 }
    )
  }
  if (campagne.status !== "brouillon" && campagne.status !== "planifie") {
    return NextResponse.json(
      {
        error: `Statut invalide pour envoi : ${campagne.status}. Seules les campagnes Brouillon ou Planifie peuvent etre envoyees.`,
      },
      { status: 400 }
    )
  }
  if (!campagne.lists || campagne.lists.length === 0) {
    return NextResponse.json(
      { error: "Aucune liste de diffusion selectionnee." },
      { status: 400 }
    )
  }

  const contacts = await prisma.marketingContact.findMany({
    where: {
      unsubscribed: false,
      lists: { hasSome: campagne.lists },
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (contacts.length === 0) {
    return NextResponse.json(
      {
        error:
          "Aucun destinataire actif dans les listes selectionnees. Synchronisez le CRM ou ajoutez des contacts.",
      },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl()

  // Marquer la campagne en cours d'envoi
  await prisma.marketingCampaign.update({
    where: { id: campagne.id },
    data: { status: "en_cours_envoi", sentAt: new Date() },
  })

  let envoyes = 0
  let erreurs = 0
  const totalBatches = Math.ceil(contacts.length / BATCH_SIZE)

  try {
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1

      const results = await Promise.all(
        batch.map(async (contact) => {
          try {
            const html = renderCampaignHtmlWithTracking({
              body: campagne.body,
              subject: campagne.subject,
              campaignId: campagne.id,
              contactEmail: contact.email,
              contactFirstName: contact.firstName,
              contactLastName: contact.lastName,
              baseUrl,
            })
            const r = await sendEmail({
              to: contact.email,
              subject: campagne.subject,
              html,
            })
            return { ok: Boolean(r?.success), email: contact.email }
          } catch (e) {
            console.warn(
              "[campagnes/envoyer]",
              contact.email,
              e instanceof Error ? e.message : e
            )
            return { ok: false, email: contact.email }
          }
        })
      )

      for (const r of results) {
        if (r.ok) envoyes += 1
        else erreurs += 1
      }

      try {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "UPDATE",
            entityType: "MarketingCampaign",
            entityId: campagne.id,
            description: `Campagne "${campagne.title}" : batch ${batchIndex}/${totalBatches} (${batch.length} emails)`,
          },
        })
      } catch {
        // best-effort
      }

      // Delai entre batches sauf pour le dernier
      if (i + BATCH_SIZE < contacts.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS)
      }
    }

    // Fin d'envoi
    await prisma.marketingCampaign.update({
      where: { id: campagne.id },
      data: { status: "envoye" },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "MarketingCampaign",
        entityId: campagne.id,
        description: `Campagne "${campagne.title}" envoyee a ${envoyes} destinataire${envoyes > 1 ? "s" : ""} (${erreurs} erreur${erreurs > 1 ? "s" : ""})`,
      },
    })

    sendPushToAllAdmins({
      title: "Campagne envoyee",
      body: `${campagne.title} : ${envoyes} email${envoyes > 1 ? "s" : ""} envoye${envoyes > 1 ? "s" : ""}.`,
      url: `/admin/mail-marketing/campagnes/${campagne.id}`,
    }).catch(() => undefined)

    return NextResponse.json({
      success: true,
      destinataires: contacts.length,
      envoyes,
      erreurs,
    })
  } catch (error) {
    // En cas d'erreur critique, repasser la campagne en brouillon
    try {
      await prisma.marketingCampaign.update({
        where: { id: campagne.id },
        data: { status: "brouillon", sentAt: null },
      })
    } catch {
      // best-effort
    }
    console.error("[api/marketing/campagnes/[id]/envoyer]", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Erreur lors de l'envoi : ${error.message}`
            : "Erreur lors de l'envoi",
      },
      { status: 500 }
    )
  }
}
