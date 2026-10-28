import type { Prisma, PrismaClient } from "@prisma/client"

import { generateRecuReference } from "@/lib/formations"

export const EXPENSE_CATEGORIES_LABELS: Record<string, string> = {
  equipement: "Equipement",
  transport: "Transport",
  sous_traitance: "Sous-traitance",
  charges_fixes: "Charges fixes",
  marketing: "Marketing",
  divers: "Divers",
}

export const EXPENSE_CATEGORIES_COLORS: Record<string, string> = {
  equipement: "#C8151B",
  transport: "#F5B800",
  sous_traitance: "#3B82F6",
  charges_fixes: "#8B5CF6",
  marketing: "#10B981",
  divers: "#6B7280",
}

export const EXPENSE_CATEGORY_KEYS = Object.keys(
  EXPENSE_CATEGORIES_LABELS
) as Array<keyof typeof EXPENSE_CATEGORIES_LABELS>

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "0 FCFA"
  }
  return (
    new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA"
  )
}

export function formatMarge(marge: number): string {
  if (!Number.isFinite(marge)) return "0%"
  return marge.toFixed(1) + "%"
}

export function getMargeColor(marge: number): string {
  if (!Number.isFinite(marge)) return "text-zinc-500"
  if (marge >= 50) return "text-emerald-600"
  if (marge >= 20) return "text-yellow-600"
  return "text-red-600"
}

export function getMargeBarColor(marge: number): string {
  if (!Number.isFinite(marge)) return "bg-zinc-300"
  if (marge >= 50) return "bg-emerald-500"
  if (marge >= 20) return "bg-yellow-500"
  return "bg-red-500"
}

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aout",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function buildTwelveMonthsSeries<T extends { paidAt?: Date | null; date?: Date | null }>(
  items: T[],
  pickAmount: (item: T) => number,
  pickDate: (item: T) => Date | null,
  now: Date = new Date()
) {
  const series: Array<{ mois: string; montant: number }> = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    series.push({ mois: MONTH_LABELS[d.getMonth()], montant: 0 })
  }
  for (const item of items) {
    const date = pickDate(item)
    if (!date) continue
    const monthsAgo =
      (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth())
    const idx = 11 - monthsAgo
    if (idx >= 0 && idx < 12) {
      series[idx].montant += pickAmount(item)
    }
  }
  return series
}

export { MONTH_LABELS }

// ---------------------------------------------------------------------------
// Recettes : definition unique, utilisee par la comptabilite, les exports et
// le tableau de bord. Historique non retroactif :
// - facture (hors avoir) payee : recette a sa date de paiement, y compris si
//   elle a ete annulee ensuite par un avoir (statut "annulee", paidAt conserve)
// - avoir dont la facture d'origine a ete payee : montant negatif a sa date
//   d'emission (le remboursement tombe dans le mois de l'avoir)
// - avoir sur une facture impayee : aucun effet (aucun argent n'a circule)
// - paiements formations confirmes (D-113, D-123) : inchanges
// ---------------------------------------------------------------------------

type Db = PrismaClient | Prisma.TransactionClient

export type DateRange = { gte?: Date; lt?: Date; lte?: Date }

export type RecetteSource = "invoice" | "avoir" | "formation"

export type RecetteEntry = {
  source: RecetteSource
  id: string
  reference: string
  // Date d'encaissement : paidAt (facture), issuedAt (avoir), confirmedAt (formation)
  date: Date
  issuedAt: Date | null
  // Montants signes : negatifs pour un avoir
  subtotalHt: number
  brsAmount: number
  tvaAmount: number
  totalTtc: number
  clientId: string | null
  clientName: string
  projectId: string | null
  projectTitle: string | null
  // Formation payee partiellement (amountPaid inferieur au prix)
  partialPayment: boolean
}

export const AVOIR_SUFFIX = "-AVOIR"

// Reference de la facture d'origine d'un avoir (format fixe D-023)
export function avoirOriginReference(reference: string): string | null {
  return reference.endsWith(AVOIR_SUFFIX)
    ? reference.slice(0, -AVOIR_SUFFIX.length)
    : null
}

// Une facture est une recette si elle a ete payee : statut "payee", ou
// "annulee" avec une date de paiement (payee puis remboursee par avoir)
export function invoiceIsRecette(invoice: {
  type: string
  status: string
  paidAt: Date | null
}): boolean {
  return (
    invoice.type !== "avoir" &&
    invoice.paidAt !== null &&
    (invoice.status === "payee" || invoice.status === "annulee")
  )
}

function inRange(date: Date | null | undefined, range: DateRange): boolean {
  if (!date) return false
  const t = date.getTime()
  if (range.gte && t < range.gte.getTime()) return false
  if (range.lt && t >= range.lt.getTime()) return false
  if (range.lte && t > range.lte.getTime()) return false
  return true
}

type InvoiceForRecette = {
  id: string
  reference: string
  type: string
  status: string
  paidAt: Date | null
  issuedAt: Date | null
  subtotalHt: number
  brsAmount: number
  tvaAmount: number
  totalTtc: number
  clientId: string
  projectId: string | null
  client: { name: string } | null
  project: { title: string } | null
}

// Coeur pur du calcul : factures et avoirs deja charges, plus la date de
// paiement des factures d'origine des avoirs (par reference)
export function buildInvoiceRecettes(
  invoices: InvoiceForRecette[],
  avoirs: InvoiceForRecette[],
  originPaidAt: Map<string, Date | null>,
  range: DateRange
): RecetteEntry[] {
  const entries: RecetteEntry[] = []
  for (const inv of invoices) {
    if (!invoiceIsRecette(inv) || !inRange(inv.paidAt, range)) continue
    entries.push({
      source: "invoice",
      id: inv.id,
      reference: inv.reference,
      date: inv.paidAt as Date,
      issuedAt: inv.issuedAt,
      subtotalHt: inv.subtotalHt,
      brsAmount: inv.brsAmount,
      tvaAmount: inv.tvaAmount,
      totalTtc: inv.totalTtc,
      clientId: inv.clientId,
      clientName: inv.client?.name ?? "",
      projectId: inv.projectId,
      projectTitle: inv.project?.title ?? null,
      partialPayment: false,
    })
  }
  for (const av of avoirs) {
    if (av.type !== "avoir" || !inRange(av.issuedAt, range)) continue
    const origin = avoirOriginReference(av.reference)
    if (!origin || !originPaidAt.get(origin)) continue
    // Montants de l'avoir deja negatifs (D-148)
    entries.push({
      source: "avoir",
      id: av.id,
      reference: av.reference,
      date: av.issuedAt as Date,
      issuedAt: av.issuedAt,
      subtotalHt: av.subtotalHt,
      brsAmount: av.brsAmount,
      tvaAmount: av.tvaAmount,
      totalTtc: av.totalTtc,
      clientId: av.clientId,
      clientName: av.client?.name ?? "",
      projectId: av.projectId,
      projectTitle: av.project?.title ?? null,
      partialPayment: false,
    })
  }
  return entries
}

const invoiceSelect = {
  id: true,
  reference: true,
  type: true,
  status: true,
  paidAt: true,
  issuedAt: true,
  subtotalHt: true,
  brsAmount: true,
  tvaAmount: true,
  totalTtc: true,
  clientId: true,
  projectId: true,
  client: { select: { name: true } },
  project: { select: { title: true } },
} as const

// Recettes d'une periode (toutes periodes si range est vide), triees par date
export async function loadRecettes(
  db: Db,
  range: DateRange = {},
  options: { clientId?: string; includeFormations?: boolean } = {}
): Promise<RecetteEntry[]> {
  const clientFilter = options.clientId ? { clientId: options.clientId } : {}
  const hasRange = Boolean(range.gte || range.lt || range.lte)
  const includeFormations =
    (options.includeFormations ?? true) && !options.clientId

  const [invoices, avoirs, formations] = await Promise.all([
    db.invoice.findMany({
      where: {
        ...clientFilter,
        type: { not: "avoir" },
        status: { in: ["payee", "annulee"] },
        paidAt: hasRange ? range : { not: null },
      },
      select: invoiceSelect,
    }),
    db.invoice.findMany({
      where: {
        ...clientFilter,
        type: "avoir",
        ...(hasRange ? { issuedAt: range } : {}),
      },
      select: invoiceSelect,
    }),
    includeFormations
      ? db.trainingRegistration.findMany({
          where: {
            status: "confirme",
            ...(hasRange ? { confirmedAt: range } : {}),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            amountPaid: true,
            confirmedAt: true,
            registeredAt: true,
            session: { select: { id: true, title: true, price: true } },
          },
        })
      : Promise.resolve([]),
  ])

  // Une seule requete pour les factures d'origine de tous les avoirs
  const originRefs = avoirs
    .map((a) => avoirOriginReference(a.reference))
    .filter((r): r is string => Boolean(r))
  const origins = originRefs.length
    ? await db.invoice.findMany({
        where: { reference: { in: originRefs } },
        select: { reference: true, paidAt: true },
      })
    : []
  const originPaidAt = new Map(origins.map((o) => [o.reference, o.paidAt]))

  const entries = buildInvoiceRecettes(invoices, avoirs, originPaidAt, range)

  for (const r of formations) {
    if (!r.confirmedAt) continue
    const paid = r.amountPaid ?? r.session.price
    entries.push({
      source: "formation",
      id: r.id,
      reference: generateRecuReference(r.id),
      date: r.confirmedAt,
      issuedAt: r.registeredAt,
      subtotalHt: paid,
      brsAmount: 0,
      tvaAmount: 0,
      totalTtc: paid,
      clientId: null,
      clientName: `${r.firstName} ${r.lastName}`,
      projectId: r.session.id,
      projectTitle: r.session.title,
      partialPayment: paid < r.session.price,
    })
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function filterRecettes(
  entries: RecetteEntry[],
  range: DateRange
): RecetteEntry[] {
  return entries.filter((e) => inRange(e.date, range))
}

export function sumRecettes(entries: RecetteEntry[]): number {
  return entries.reduce((sum, e) => sum + e.totalTtc, 0)
}

// Recettes par projet (factures et avoirs ; les formations n'ont pas de projet)
export function recettesByProject(entries: RecetteEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of entries) {
    if (e.source === "formation" || !e.projectId) continue
    map.set(e.projectId, (map.get(e.projectId) ?? 0) + e.totalTtc)
  }
  return map
}
