import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import * as XLSX from "xlsx"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EXPENSE_CATEGORIES_LABELS } from "@/lib/comptabilite"
import { generateRecuReference } from "@/lib/formations"

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  confirme: "Confirme",
  en_cours: "En cours",
  livre: "Livre",
  archive: "Archive",
  perdu: "Perdu",
  termine: "Termine",
  annule: "Annule",
  pause: "Pause",
}

function periodeRange(year: number, month: number | null) {
  if (month !== null) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    return { start, end, label: `${String(month).padStart(2, "0")}-${year}` }
  }
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { start, end, label: String(year) }
}

function applyHeaderStyle(
  ws: XLSX.WorkSheet,
  cols: number,
  rowIndex: number = 0
) {
  for (let c = 0; c < cols; c++) {
    const cell = XLSX.utils.encode_cell({ r: rowIndex, c })
    if (!ws[cell]) continue
    ws[cell].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "C8151B" } },
      alignment: { horizontal: "center", vertical: "center" },
    }
  }
}

function setNumberFormat(
  ws: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  columns: number[]
) {
  for (let r = startRow; r <= endRow; r++) {
    for (const c of columns) {
      const cell = XLSX.utils.encode_cell({ r, c })
      if (ws[cell]) {
        ws[cell].t = "n"
        ws[cell].z = "#,##0"
      }
    }
  }
}

function autoSizeColumns(rows: (string | number)[][], headerLen: number[]) {
  const widths = [...headerLen]
  for (const row of rows) {
    row.forEach((val, i) => {
      const len = String(val ?? "").length
      if (len > (widths[i] ?? 0)) widths[i] = len
    })
  }
  return widths.map((w) => ({ wch: Math.min(60, Math.max(10, w + 2)) }))
}

function formatDateFr(d: Date | null) {
  if (!d) return ""
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
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
    const { start, end, label } = periodeRange(year, month)

    const [invoicesPayees, formationsConfirmees, expenses, projects] =
      await Promise.all([
        prisma.invoice.findMany({
          where: {
            status: "payee",
            type: { not: "avoir" },
            paidAt: { gte: start, lt: end },
          },
          include: {
            client: { select: { name: true } },
            project: { select: { title: true } },
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
          include: { project: { select: { title: true } } },
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

    const wb = XLSX.utils.book_new()

    // Feuille 1 : Resume
    const resumeRows: (string | number)[][] = [
      ["Indicateur", "Valeur"],
      ["Periode", label],
      ["Total recettes (FCFA)", Math.round(totalRecettes)],
      ["  dont factures payees (FCFA)", Math.round(totalRecettesFactures)],
      [
        "  dont paiements formations (FCFA)",
        Math.round(totalRecettesFormations),
      ],
      ["Total depenses (FCFA)", Math.round(totalDepenses)],
      ["Benefice net (FCFA)", Math.round(benefice)],
      ["Marge (%)", Number(marge.toFixed(2))],
      ["Nombre factures payees", invoicesPayees.length],
      ["Nombre paiements formations", formationsConfirmees.length],
      ["Nombre depenses", expenses.length],
    ]
    const wsResume = XLSX.utils.aoa_to_sheet(resumeRows)
    applyHeaderStyle(wsResume, 2)
    setNumberFormat(wsResume, 2, resumeRows.length - 1, [1])
    wsResume["!cols"] = autoSizeColumns(resumeRows, [34, 22])
    XLSX.utils.book_append_sheet(wb, wsResume, "Resume")

    // Feuille 2 : Recettes (factures payees + paiements formations)
    const recettesHeader = [
      "Date",
      "Type",
      "Reference",
      "Client",
      "Projet / Session",
      "Montant HT",
      "BRS",
      "TVA",
      "Total TTC",
    ]
    type RecetteRow = {
      sortDate: number
      date: string
      type: string
      reference: string
      client: string
      projet: string
      ht: number
      brs: number
      tva: number
      ttc: number
    }
    const recettesData: RecetteRow[] = [
      ...invoicesPayees.map((inv) => ({
        sortDate: inv.paidAt ? inv.paidAt.getTime() : 0,
        date: formatDateFr(inv.paidAt),
        type: "Facture",
        reference: inv.reference,
        client: inv.client?.name ?? "",
        projet: inv.project?.title ?? "",
        ht: Math.round(inv.subtotalHt),
        brs: Math.round(inv.brsAmount),
        tva: Math.round(inv.tvaAmount),
        ttc: Math.round(inv.totalTtc),
      })),
      ...formationsConfirmees.map((r) => {
        const paid = r.amountPaid ?? r.session.price
        const isAcompte = paid < r.session.price
        return {
          sortDate: r.confirmedAt ? r.confirmedAt.getTime() : 0,
          date: formatDateFr(r.confirmedAt),
          type: isAcompte ? "Formation (acompte)" : "Formation",
          reference: generateRecuReference(r.id),
          client: `${r.firstName} ${r.lastName}`,
          projet: r.session.title,
          ht: Math.round(paid),
          brs: 0,
          tva: 0,
          ttc: Math.round(paid),
        }
      }),
    ].sort((a, b) => a.sortDate - b.sortDate)

    const recettesRows: (string | number)[][] = [recettesHeader]
    for (const row of recettesData) {
      recettesRows.push([
        row.date,
        row.type,
        row.reference,
        row.client,
        row.projet,
        row.ht,
        row.brs,
        row.tva,
        row.ttc,
      ])
    }
    const wsRecettes = XLSX.utils.aoa_to_sheet(recettesRows)
    applyHeaderStyle(wsRecettes, recettesHeader.length)
    setNumberFormat(
      wsRecettes,
      1,
      recettesRows.length - 1,
      [5, 6, 7, 8]
    )
    wsRecettes["!cols"] = autoSizeColumns(
      recettesRows,
      recettesHeader.map((h) => h.length)
    )
    XLSX.utils.book_append_sheet(wb, wsRecettes, "Recettes")

    // Feuille 3 : Depenses
    const depensesHeader = [
      "Date",
      "Description",
      "Categorie",
      "Projet",
      "Montant",
    ]
    const depensesRows: (string | number)[][] = [depensesHeader]
    for (const exp of expenses) {
      depensesRows.push([
        formatDateFr(exp.date),
        exp.description,
        EXPENSE_CATEGORIES_LABELS[exp.category] ?? exp.category,
        exp.project?.title ?? "",
        Math.round(exp.amount),
      ])
    }
    const wsDepenses = XLSX.utils.aoa_to_sheet(depensesRows)
    applyHeaderStyle(wsDepenses, depensesHeader.length)
    setNumberFormat(wsDepenses, 1, depensesRows.length - 1, [4])
    wsDepenses["!cols"] = autoSizeColumns(
      depensesRows,
      depensesHeader.map((h) => h.length)
    )
    XLSX.utils.book_append_sheet(wb, wsDepenses, "Depenses")

    // Feuille 4 : Rentabilite par projet
    const rentaHeader = [
      "Projet",
      "Client",
      "Statut",
      "Recettes",
      "Depenses",
      "Benefice",
      "Marge %",
    ]
    const rentaData = projects
      .map((p) => {
        const r = p.invoices.reduce((s, i) => s + i.totalTtc, 0)
        const d = p.expenses.reduce((s, e) => s + e.amount, 0)
        const b = r - d
        const m = r > 0 ? (b / r) * 100 : 0
        return {
          title: p.title,
          client: p.client.name,
          status: STATUS_LABELS[p.status] ?? p.status,
          recettes: r,
          depenses: d,
          benefice: b,
          marge: m,
        }
      })
      .filter((p) => p.recettes > 0 || p.depenses > 0)
      .sort((a, b) => b.recettes - a.recettes)

    const rentaRows: (string | number)[][] = [rentaHeader]
    for (const p of rentaData) {
      rentaRows.push([
        p.title,
        p.client,
        p.status,
        Math.round(p.recettes),
        Math.round(p.depenses),
        Math.round(p.benefice),
        Number(p.marge.toFixed(2)),
      ])
    }
    const wsRenta = XLSX.utils.aoa_to_sheet(rentaRows)
    applyHeaderStyle(wsRenta, rentaHeader.length)
    setNumberFormat(wsRenta, 1, rentaRows.length - 1, [3, 4, 5, 6])
    wsRenta["!cols"] = autoSizeColumns(
      rentaRows,
      rentaHeader.map((h) => h.length)
    )
    XLSX.utils.book_append_sheet(wb, wsRenta, "Rentabilite")

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true,
    }) as Buffer

    const filename = `jolofstream-comptabilite-${label}.xlsx`
    const body = new Uint8Array(buffer)

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/comptabilite/export/excel]", error)
    return NextResponse.json(
      { error: "Erreur generation Excel" },
      { status: 500 }
    )
  }
}
