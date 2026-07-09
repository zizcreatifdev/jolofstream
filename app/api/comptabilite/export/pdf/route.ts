import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { renderToBuffer } from "@react-pdf/renderer"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EXPENSE_CATEGORIES_LABELS } from "@/lib/comptabilite"
import { generateRecuReference } from "@/lib/formations"
import { PARAM_DEFAULTS } from "@/lib/parametres"
import {
  PdfRapportComptable,
  type CategorieTotal,
  type DepenseItem,
  type RecetteItem,
  type RentabiliteItem,
} from "@/components/admin/comptabilite/pdf-rapport-comptable"

const MONTH_LABELS_FR = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
]

function periodeRange(year: number, month: number | null) {
  if (month !== null) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    const label = `${MONTH_LABELS_FR[month - 1]} ${year}`
    return { start, end, label, fileLabel: `${year}-${String(month).padStart(2, "0")}` }
  }
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { start, end, label: `Annee ${year}`, fileLabel: String(year) }
}

function formatDateFr(d: Date | null) {
  if (!d) return ""
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

async function loadCompany() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["company_name", "company_address"] } },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))
    return {
      companyName:
        map.get("company_name") || PARAM_DEFAULTS.company_name || "Jolof Stream",
      companyAddress:
        map.get("company_address") ||
        PARAM_DEFAULTS.company_address ||
        "Dakar, Senegal",
    }
  } catch {
    return {
      companyName: PARAM_DEFAULTS.company_name || "Jolof Stream",
      companyAddress: PARAM_DEFAULTS.company_address || "Dakar, Senegal",
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const year = Number(searchParams.get("year") ?? now.getFullYear())
    const monthParam = searchParams.get("month")
    const month = monthParam ? Number(monthParam) : null
    const { start, end, label, fileLabel } = periodeRange(year, month)

    const [invoicesPayees, formationsConfirmees, expenses, projects, company] =
      await Promise.all([
        prisma.invoice.findMany({
          where: {
            status: "payee",
            type: { not: "avoir" },
            paidAt: { gte: start, lt: end },
          },
          include: {
            client: { select: { name: true } },
          },
          orderBy: { paidAt: "asc" },
        }),
        prisma.trainingRegistration.findMany({
          where: {
            status: "confirme",
            confirmedAt: { gte: start, lt: end },
          },
          include: {
            session: { select: { title: true, price: true } },
          },
          orderBy: { confirmedAt: "asc" },
        }),
        prisma.expense.findMany({
          where: { date: { gte: start, lt: end } },
          orderBy: { date: "asc" },
        }),
        prisma.project.findMany({
          include: {
            client: { select: { name: true } },
            invoices: {
              where: {
                status: "payee",
                type: { not: "avoir" },
                paidAt: { gte: start, lt: end },
              },
              select: { totalTtc: true },
            },
            expenses: {
              where: { date: { gte: start, lt: end } },
              select: { amount: true },
            },
          },
        }),
        loadCompany(),
      ])

    const totalRecettesFactures = invoicesPayees.reduce(
      (s, i) => s + i.totalTtc,
      0
    )
    const totalRecettesFormations = formationsConfirmees.reduce(
      (s, r) => s + (r.amountPaid ?? r.session.price),
      0
    )
    const totalRecettes = totalRecettesFactures + totalRecettesFormations
    const totalDepenses = expenses.reduce((s, e) => s + e.amount, 0)
    const benefice = totalRecettes - totalDepenses
    const marge = totalRecettes > 0 ? (benefice / totalRecettes) * 100 : 0

    const recettesCombined: Array<RecetteItem & { sortDate: number }> = [
      ...invoicesPayees.map((i) => ({
        sortDate: i.paidAt ? i.paidAt.getTime() : 0,
        date: formatDateFr(i.paidAt),
        reference: i.reference,
        client: i.client?.name ?? "",
        totalTtc: i.totalTtc,
      })),
      ...formationsConfirmees.map((r) => {
        const paid = r.amountPaid ?? r.session.price
        const isAcompte = paid < r.session.price
        return {
          sortDate: r.confirmedAt ? r.confirmedAt.getTime() : 0,
          date: formatDateFr(r.confirmedAt),
          reference: generateRecuReference(r.id),
          client: `${r.firstName} ${r.lastName} (Formation${isAcompte ? " - acompte" : ""} : ${r.session.title})`,
          totalTtc: paid,
        }
      }),
    ].sort((a, b) => a.sortDate - b.sortDate)

    const recettes: RecetteItem[] = recettesCombined.map(
      ({ date, reference, client, totalTtc }) => ({
        date,
        reference,
        client,
        totalTtc,
      })
    )

    const depensesItems: DepenseItem[] = expenses.map((e) => ({
      date: formatDateFr(e.date),
      description: e.description,
      categorie: EXPENSE_CATEGORIES_LABELS[e.category] ?? e.category,
      montant: e.amount,
    }))

    // Categories aggregees
    const catMap = new Map<string, number>()
    for (const e of expenses) {
      catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount)
    }
    const categories: CategorieTotal[] = Array.from(catMap.entries())
      .map(([k, v]) => ({
        categorie: EXPENSE_CATEGORIES_LABELS[k] ?? k,
        montant: v,
        pourcentage: totalDepenses > 0 ? (v / totalDepenses) * 100 : 0,
      }))
      .sort((a, b) => b.montant - a.montant)

    const rentabilite: RentabiliteItem[] = projects
      .map((p) => {
        const r = p.invoices.reduce((s, i) => s + i.totalTtc, 0)
        const d = p.expenses.reduce((s, e) => s + e.amount, 0)
        const b = r - d
        const m = r > 0 ? (b / r) * 100 : 0
        return {
          title: p.title,
          client: p.client.name,
          recettes: r,
          depenses: d,
          benefice: b,
          marge: m,
        }
      })
      .filter((p) => p.recettes > 0 || p.depenses > 0)
      .sort((a, b) => b.benefice - a.benefice)

    const generatedAt = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now)

    const pdfElement = PdfRapportComptable({
      periode: label,
      resume: {
        totalRecettes,
        totalDepenses,
        benefice,
        marge,
        countRecettes: invoicesPayees.length + formationsConfirmees.length,
        countDepenses: expenses.length,
      },
      recettes,
      depenses: depensesItems,
      rentabilite,
      categories,
      companyName: company.companyName,
      companyAddress: company.companyAddress,
      generatedAt,
    })

    const buffer = await renderToBuffer(pdfElement)
    const filename = `jolofstream-rapport-${fileLabel}.pdf`
    const body = new Uint8Array(buffer)

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/comptabilite/export/pdf]", error)
    return NextResponse.json(
      { error: "Erreur generation PDF" },
      { status: 500 }
    )
  }
}
