import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { quoteRequestSchema, serviceTypeLabels } from "@/lib/schemas"
import { sendEmail } from "@/lib/email"
import NouveauLeadEmail from "@/emails/nouveau-lead"

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide" },
      { status: 400 }
    )
  }

  const parsed = quoteRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Donnees invalides",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const data = parsed.data
  const serviceLabel = serviceTypeLabels[data.serviceType]
  const fullName = `${data.firstName} ${data.lastName}`

  try {
    const client = await prisma.client.create({
      data: {
        type: data.organization ? "entreprise" : "particulier",
        name: fullName,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        acquisitionChannel: "site_web",
        status: "prospect",
        notes: [
          `Demande de devis - ${serviceLabel}`,
          `Date souhaitee : ${data.desiredDate}`,
          `Lieu : ${data.location}`,
          data.description ? `Description :\n${data.description}` : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
        tags: ["lead-site-web"],
      },
    })

    // ActivityLog requiert un userId non null. Sur cette route publique,
    // pas de session admin. Le log est cree cote admins via l'email de notification.

    // Notification email aux admins (echec non bloquant)
    try {
      const adminSettings = await prisma.setting.findMany({
        where: { key: { in: ["admin1_email", "admin2_email"] } },
      })
      const recipients = adminSettings
        .map((s) => s.value)
        .filter((v): v is string => Boolean(v && v.includes("@")))

      if (recipients.length > 0) {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
        await sendEmail({
          to: recipients,
          subject: `Nouvelle demande de devis - ${serviceLabel}`,
          react: NouveauLeadEmail({
            clientName: fullName,
            clientEmail: data.email,
            clientPhone: data.phone,
            clientOrganization: data.organization ?? "",
            serviceType: serviceLabel,
            projectDate: data.desiredDate,
            projectLocation: data.location,
            projectDescription: data.description ?? "",
            dashboardUrl: `${baseUrl}/admin/clients/${client.id}`,
          }),
        })
      }
    } catch (e) {
      console.warn("[api/contact/devis] email admins echoue", e)
    }

    return NextResponse.json({ success: true, clientId: client.id })
  } catch (error) {
    console.warn(
      "[api/contact/devis] DB indisponible, donnees logguees uniquement",
      { data, error: error instanceof Error ? error.message : error }
    )
    return NextResponse.json({ success: true, dbSkipped: true })
  }
}
