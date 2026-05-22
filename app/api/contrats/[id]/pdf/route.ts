import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { renderToBuffer } from "@react-pdf/renderer"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PARAM_DEFAULTS } from "@/lib/parametres"
import { contratReference, type TemplateType } from "@/lib/contrats"
import { PdfContrat } from "@/components/admin/contrats/pdf-contrat"

const COMPANY_KEYS = [
  "company_name",
  "company_address",
  "company_email",
  "company_phone",
  "company_ninea",
  "pdf_signature_url",
] as const

function formatDateFr(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

async function loadCompany() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...COMPANY_KEYS] } },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))
    return {
      companyName: map.get("company_name") || PARAM_DEFAULTS.company_name,
      companyAddress:
        map.get("company_address") || PARAM_DEFAULTS.company_address,
      companyEmail: map.get("company_email") || PARAM_DEFAULTS.company_email,
      companyPhone: map.get("company_phone") || PARAM_DEFAULTS.company_phone,
      companyNinea: map.get("company_ninea") || PARAM_DEFAULTS.company_ninea,
      signatureUrl: map.get("pdf_signature_url") || null,
    }
  } catch {
    return {
      companyName: PARAM_DEFAULTS.company_name,
      companyAddress: PARAM_DEFAULTS.company_address,
      companyEmail: PARAM_DEFAULTS.company_email,
      companyPhone: PARAM_DEFAULTS.company_phone,
      companyNinea: PARAM_DEFAULTS.company_ninea,
      signatureUrl: null,
    }
  }
}

export async function GET(
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

    const company = await loadCompany()
    const reference = contratReference(contract.id)
    const generatedAt = formatDateFr(new Date()) ?? ""

    const pdfElement = PdfContrat({
      contrat: {
        reference,
        templateType: contract.templateType as TemplateType,
        notes: contract.notes,
        createdAt: formatDateFr(contract.createdAt) ?? generatedAt,
      },
      client: {
        name: contract.client.name,
        organization: contract.client.organization,
        email: contract.client.email,
        phone: contract.client.phone,
      },
      project: {
        title: contract.project.title,
        type: contract.project.type,
        date: formatDateFr(contract.project.date),
        location: contract.project.location,
      },
      signatureUrl: company.signatureUrl,
      companyName: company.companyName,
      companyAddress: company.companyAddress,
      companyEmail: company.companyEmail,
      companyPhone: company.companyPhone,
      companyNinea: company.companyNinea,
      date: generatedAt,
    })

    const buffer = await renderToBuffer(pdfElement)
    const body = new Uint8Array(buffer)
    const filename = `contrat-${reference}.pdf`

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/contrats/[id]/pdf]", error)
    return NextResponse.json(
      { error: "Erreur generation PDF" },
      { status: 500 }
    )
  }
}
