import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { notifyAllAdmins } from "@/lib/notifications"
import {
  camerasLabel,
  desiredDateLabel,
  needLabel,
  platformsLabel,
  quoteRequestInputSchema,
} from "@/lib/quote-requests"
import { clientIp, rateLimitHit, rateLimitRecord } from "@/lib/rate-limit"
import { getSiteContact } from "@/lib/site-settings"
import NouveauLeadEmail from "@/emails/nouveau-lead"
import AccuseReceptionDevisEmail from "@/emails/accuse-reception-devis"

export const dynamic = "force-dynamic"

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Africa/Dakar" })

// Demande de devis du site (/contact) : client CRM, QuoteRequest, emails
export async function POST(request: Request) {
  const ip = clientIp(request)
  if (rateLimitHit(`devis:${ip}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json(
      { error: "Vous avez déjà envoyé plusieurs demandes dans l'heure. Réessayez plus tard ou appelez-nous directement." },
      { status: 429 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }
  const parsed = quoteRequestInputSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Champ piege rempli : reponse factice, rien n'est cree
  if (data.website && data.website.trim() !== "") {
    rateLimitRecord(`devis:${ip}`)
    return NextResponse.json({ success: true, id: null })
  }

  const email = data.email.toLowerCase()
  const fullName = `${data.firstName} ${data.lastName}`
  const need = needLabel(data.need)
  const noteLine = `Demande de devis du ${DAY_FMT.format(new Date())} : ${need}, voir Demandes`
  const tags = ["lead-site-web", ...(data.need === "formation" ? ["formation-entreprise"] : [])]

  let requestId: string
  try {
    // Client : meme motif que le reste du site (findFirst puis mise a jour ou creation, D-118)
    const existing = await prisma.client.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
    const client = existing
      ? await prisma.client.update({
          where: { id: existing.id },
          data: {
            phone: existing.phone || data.phone,
            organization: existing.organization || data.organization,
            tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
            notes: existing.notes ? `${existing.notes}\n${noteLine}` : noteLine,
          },
        })
      : await prisma.client.create({
          data: {
            type: data.organization ? "entreprise" : "particulier",
            name: fullName,
            email,
            phone: data.phone,
            organization: data.organization,
            acquisitionChannel: "site_web",
            status: "prospect",
            notes: noteLine,
            tags,
          },
        })
    const created = await prisma.quoteRequest.create({
      data: {
        clientId: client.id,
        need: data.need,
        desiredDate: data.desiredDate ? new Date(`${data.desiredDate}T00:00:00.000Z`) : null,
        location: data.location,
        organization: data.organization,
        platforms: data.need === "evenement_live" ? data.platforms : [],
        cameras: data.need === "evenement_live" ? data.cameras : null,
        participants: data.need === "formation" ? data.participants : null,
        description: data.description,
      },
    })
    requestId = created.id
  } catch (error) {
    console.error("[api/contact/devis]", error)
    return NextResponse.json(
      { error: "Votre demande n'a pas pu être enregistrée. Réessayez ou appelez-nous directement." },
      { status: 500 }
    )
  }
  rateLimitRecord(`devis:${ip}`)

  // Emails apres l'enregistrement : un echec est journalise, la demande reste
  const dateText = desiredDateLabel(data.desiredDate ? `${data.desiredDate}T00:00:00.000Z` : null)
  const baseUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")
  const requestUrl = `${baseUrl}/admin/demandes?demande=${requestId}`
  try {
    const adminSettings = await prisma.setting.findMany({ where: { key: { in: ["admin1_email", "admin2_email"] } } })
    const recipients = adminSettings.map((s) => s.value).filter((v): v is string => Boolean(v && v.includes("@")))
    if (recipients.length > 0) {
      const sent = await sendEmail({
        to: recipients,
        subject: `Nouvelle demande de devis : ${need} (${fullName})`,
        react: NouveauLeadEmail({
          clientName: fullName,
          clientEmail: email,
          clientPhone: data.phone,
          clientOrganization: data.organization,
          need,
          desiredDate: dateText,
          location: data.location,
          platforms: platformsLabel(data.platforms),
          cameras: camerasLabel(data.cameras),
          participants: data.participants,
          description: data.description,
          requestUrl,
        }),
      })
      if (!sent.success) console.warn("[api/contact/devis] email admin non envoye", requestId, sent.error)
    } else {
      console.warn("[api/contact/devis] aucun email admin configure", requestId)
    }
  } catch (e) {
    console.warn("[api/contact/devis] email admin echoue", requestId, e)
  }
  try {
    const contact = await getSiteContact()
    const sent = await sendEmail({
      to: email,
      subject: "Votre demande de devis est bien arrivée",
      react: AccuseReceptionDevisEmail({
        firstName: data.firstName,
        need,
        desiredDate: dateText,
        location: data.location,
        contactEmail: contact.email,
        contactPhone: contact.phone,
      }),
    })
    if (!sent.success) console.warn("[api/contact/devis] accuse de reception non envoye", requestId, sent.error)
  } catch (e) {
    console.warn("[api/contact/devis] accuse de reception echoue", requestId, e)
  }
  try {
    await notifyAllAdmins({
      type: "nouveau_lead",
      title: "Nouvelle demande de devis",
      message: `${fullName} : ${need}, ${data.location}`,
      entityType: "QuoteRequest",
      entityId: requestId,
      entityUrl: `/admin/demandes?demande=${requestId}`,
    })
  } catch (e) {
    console.warn("[api/contact/devis] notifications echec", e)
  }

  return NextResponse.json({ success: true, id: requestId })
}
