import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { quoteRequestSchema, serviceTypeLabels } from "@/lib/schemas"

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

    // Le journal d'activite est attache a un user. Sans session admin
    // sur cette route publique, on ne logge pas dans ActivityLog ici.
    // Les admins seront notifies par email (Resend) au Prompt 12.

    return NextResponse.json({ success: true, clientId: client.id })
  } catch (error) {
    console.warn(
      "[api/contact/devis] DB indisponible, donnees logguees uniquement",
      { data, error: error instanceof Error ? error.message : error }
    )
    return NextResponse.json({ success: true, dbSkipped: true })
  }
}
