import path from "path"
import { createElement, type ReactElement } from "react"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { renderToBuffer } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRecuReference } from "@/lib/formations"
import { PARAM_DEFAULTS, PARAM_KEYS } from "@/lib/parametres"
import { PdfRecuFormation } from "@/components/admin/formations/pdf-recu-formation"

export const runtime = "nodejs"

const COMPANY_KEYS = [
  PARAM_KEYS.company_name,
  PARAM_KEYS.company_address,
  PARAM_KEYS.company_email,
  PARAM_KEYS.company_phone,
  PARAM_KEYS.company_ninea,
  PARAM_KEYS.pdf_signature_url,
] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const inscription = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            dateStart: true,
            dateEnd: true,
            location: true,
            price: true,
          },
        },
      },
    })

    if (!inscription) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      )
    }

    if (inscription.status !== "confirme") {
      return NextResponse.json(
        {
          error:
            "Le recu est disponible uniquement pour les inscriptions confirmees",
        },
        { status: 400 }
      )
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: [...COMPANY_KEYS] } },
    })
    const settingsMap = new Map<string, string>(
      settings.map((s) => [s.key, s.value])
    )
    const param = (key: (typeof COMPANY_KEYS)[number]) =>
      settingsMap.get(key) ?? PARAM_DEFAULTS[key] ?? ""

    const reference = generateRecuReference(inscription.id)
    const paidAt = (inscription.confirmedAt ?? new Date()).toISOString()
    const logoSrc = path.join(
      process.cwd(),
      "public/logos/Logo_JolofStream_couleur.png"
    )
    const signatureValue = param(PARAM_KEYS.pdf_signature_url)
    const signatureUrl = signatureValue.length > 0 ? signatureValue : undefined

    const totalPrice = inscription.session.price
    const amountPaid = inscription.amountPaid ?? totalPrice

    const element = createElement(PdfRecuFormation, {
        reference,
        formation: {
          title: inscription.session.title,
          dateStart: inscription.session.dateStart
            ? inscription.session.dateStart.toISOString()
            : null,
          dateEnd: inscription.session.dateEnd
            ? inscription.session.dateEnd.toISOString()
            : null,
          location: inscription.session.location,
          price: totalPrice,
        },
        participant: {
          firstName: inscription.firstName,
          lastName: inscription.lastName,
          email: inscription.email,
          phone: inscription.phone,
        },
        paidAt,
        amountPaid,
        totalPrice,
        companyName: param(PARAM_KEYS.company_name),
        companyAddress: param(PARAM_KEYS.company_address),
        companyEmail: param(PARAM_KEYS.company_email),
        companyPhone: param(PARAM_KEYS.company_phone),
        companyNinea: param(PARAM_KEYS.company_ninea) || undefined,
        logoSrc,
        signatureUrl,
      }) as unknown as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(element)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu-formation-${reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/formations/inscriptions/:id/recu]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
