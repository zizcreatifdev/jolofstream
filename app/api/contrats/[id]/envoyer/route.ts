import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import {
  TEMPLATE_TITLES,
  contratReference,
  type TemplateType,
} from "@/lib/contrats"
import ContratEnvoyeEmail from "@/emails/contrat-envoye"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { client: true, project: true },
    })
    if (!contract) {
      return NextResponse.json(
        { error: "Contrat introuvable" },
        { status: 404 }
      )
    }
    if (contract.status !== "a_envoyer") {
      return NextResponse.json(
        {
          error: `Seuls les contrats au statut "A envoyer" peuvent etre envoyes (statut actuel : ${contract.status}).`,
        },
        { status: 400 }
      )
    }

    const reference = contratReference(contract.id)
    const templateTitle =
      TEMPLATE_TITLES[contract.templateType as TemplateType] ??
      contract.templateType
    const firstName =
      contract.client.name.split(/\s+/)[0] || contract.client.name

    let emailSent = false
    let emailError: string | null = null

    if (contract.client.email) {
      try {
        const r = await sendEmail({
          to: contract.client.email,
          subject: `Votre contrat ${templateTitle} - Jolof Stream`,
          react: ContratEnvoyeEmail({
            clientFirstName: firstName,
            templateTitle,
            reference,
            projectTitle: contract.project.title,
          }),
        })
        emailSent = Boolean(r?.success)
        if (!emailSent) emailError = r?.error ?? null
      } catch (e) {
        emailError = e instanceof Error ? e.message : "Erreur envoi"
      }
    }

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: { status: "envoye" },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Contract",
        entityId: contract.id,
        description: emailSent
          ? `Contrat ${reference} envoye a ${contract.client.email}`
          : contract.client.email
            ? `Contrat ${reference} marque envoye (email non delivre : ${emailError ?? "inconnu"})`
            : `Contrat ${reference} marque envoye (client sans adresse email)`,
      },
    })

    return NextResponse.json({
      success: true,
      statut: updated.status,
      emailSent,
      hadEmail: Boolean(contract.client.email),
    })
  } catch (error) {
    console.error("[api/contrats/[id]/envoyer]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
