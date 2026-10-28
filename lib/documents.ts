import type { Prisma } from "@prisma/client"

export const BRS_RATE = 0.05
export const TVA_RATE = 0.18

export const QUOTE_STATUSES = {
  brouillon: { label: "Brouillon", color: "bg-zinc-100 text-zinc-700" },
  envoye: { label: "Envoye", color: "bg-blue-100 text-blue-700" },
  accepte: { label: "Accepte", color: "bg-green-100 text-green-700" },
  refuse: { label: "Refuse", color: "bg-red-100 text-red-700" },
  converti: { label: "Converti", color: "bg-emerald-100 text-emerald-700" },
} as const

export const INVOICE_STATUSES = {
  emise: { label: "Emise", color: "bg-blue-100 text-blue-700" },
  payee: { label: "Payee", color: "bg-green-100 text-green-700" },
  partiellement_payee: {
    label: "Part. payee",
    color: "bg-yellow-100 text-yellow-700",
  },
  annulee: { label: "Annulee", color: "bg-zinc-200 text-zinc-500" },
} as const

export const INVOICE_TYPES = {
  standard: "Facture standard",
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
  avoir: "Avoir",
} as const

export type QuoteStatus = keyof typeof QUOTE_STATUSES
export type InvoiceStatus = keyof typeof INVOICE_STATUSES
export type InvoiceType = keyof typeof INVOICE_TYPES

export const QUOTE_STATUS_KEYS = Object.keys(QUOTE_STATUSES) as QuoteStatus[]
export const INVOICE_STATUS_KEYS = Object.keys(
  INVOICE_STATUSES
) as InvoiceStatus[]
export const INVOICE_TYPE_KEYS = Object.keys(INVOICE_TYPES) as InvoiceType[]

export function generateQuoteReference(year: number, sequence: number): string {
  return `DEV-${year}-JS-${String(sequence).padStart(3, "0")}`
}

export function generateInvoiceReference(
  year: number,
  sequence: number
): string {
  return `FAC-${year}-JS-${String(sequence).padStart(3, "0")}`
}

// Prochaine reference DEV ou FAC : basee sur le plus grand numero existant
// (pas sur un comptage, pour survivre aux suppressions de brouillons),
// en ignorant les avoirs qui reprennent la reference de leur facture + "-AVOIR".
export async function nextReference(
  tx: Prisma.TransactionClient,
  kind: "DEV" | "FAC",
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = `${kind}-${year}-JS-`
  const where = { reference: { startsWith: prefix } }
  const select = { reference: true } as const
  const rows =
    kind === "DEV"
      ? await tx.quote.findMany({ where, select })
      : await tx.invoice.findMany({ where, select })

  let max = 0
  for (const { reference } of rows) {
    if (reference.endsWith("-AVOIR")) continue
    const suffix = reference.slice(prefix.length)
    if (!/^\d+$/.test(suffix)) continue
    const value = parseInt(suffix, 10)
    if (value > max) max = value
  }

  return kind === "DEV"
    ? generateQuoteReference(year, max + 1)
    : generateInvoiceReference(year, max + 1)
}

// Regle unique statut / date de paiement des factures :
// - "payee" : paidAt toujours renseigne (payload, sinon date existante, sinon maintenant)
// - "partiellement_payee" : paidAt du payload s'il est fourni, sinon conserve
//   (non compte en recette : la comptabilite ne compte que "payee")
// - tout autre statut : paidAt = null, la facture sort des recettes
export function resolvePaidAt(
  status: string,
  currentPaidAt: Date | null | undefined,
  payloadPaidAt?: string | null
): Date | null {
  const fromPayload = payloadPaidAt ? new Date(payloadPaidAt) : null
  const validPayload =
    fromPayload && !Number.isNaN(fromPayload.getTime()) ? fromPayload : null
  if (status === "payee") return validPayload ?? currentPaidAt ?? new Date()
  if (status === "partiellement_payee") {
    return validPayload ?? currentPaidAt ?? null
  }
  return null
}

export class ReferenceConflictError extends Error {
  constructor() {
    super("Conflit de numerotation, reessayez.")
    this.name = "ReferenceConflictError"
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  )
}

// Execute une creation numerotee ; en cas de collision sur la contrainte
// unique (creation concurrente), recalcule la reference et reessaie.
export async function withReferenceRetry<T>(
  run: () => Promise<T>,
  attempts: number = 3
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await run()
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
    }
  }
  throw new ReferenceConflictError()
}

// Titre affiche en tete de document : identique dans l'apercu HTML et le PDF
export function titleFor(
  type: "devis" | "facture",
  invoiceType?: string | null
): string {
  if (type === "devis") return "DEVIS"
  if (invoiceType === "avoir") return "AVOIR"
  if (invoiceType === "acompte") return "FACTURE D'ACOMPTE"
  if (invoiceType === "solde") return "FACTURE DE SOLDE"
  return "FACTURE"
}

// Montant pour les PDF React-PDF : Intl "fr-FR" insere une espace fine
// insecable (U+202F) que la police Helvetica affiche "/" (D-115). Ici le
// separateur de milliers est une espace standard (U+0020).
export function formatFCFAPdf(amount: number): string {
  const rounded = Math.round(amount || 0)
  const sign = rounded < 0 ? "-" : ""
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${sign}${digits} FCFA`
}

export type DocumentFormInitial = {
  id?: string
  clientId?: string
  projectId?: string | null
  subject?: string
  status?: string
  brsEnabled?: boolean
  tvaEnabled?: boolean
  dateField?: string | null
  notes?: string | null
  invoiceType?: InvoiceType
  lines?: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
}

type DateLike = Date | string | null | undefined

// Forme commune d'un devis ou d'une facture complet, qu'il vienne de Prisma
// (dates en Date) ou de GET /api/devis/[id] et /api/factures/[id] (dates en ISO)
export type DocumentSource = {
  id: string
  clientId: string
  projectId: string | null
  status: string
  subject?: string | null
  type?: string | null
  brsEnabled: boolean
  tvaEnabled: boolean
  validUntil?: DateLike
  dueAt?: DateLike
  notes: string | null
  lines: Array<{ description: string; quantity: number; unitPrice: number }>
}

function toDateOnly(value: DateLike): string | null {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

// Source unique des valeurs initiales du formulaire d'edition
export function toDocumentFormInitial(
  doc: DocumentSource,
  kind: "devis" | "facture"
): DocumentFormInitial {
  const invoiceType =
    kind === "facture" &&
    doc.type &&
    (INVOICE_TYPE_KEYS as string[]).includes(doc.type)
      ? (doc.type as InvoiceType)
      : undefined
  return {
    id: doc.id,
    clientId: doc.clientId,
    projectId: doc.projectId,
    subject: doc.subject ?? "",
    status: doc.status,
    brsEnabled: doc.brsEnabled,
    tvaEnabled: doc.tvaEnabled,
    dateField: toDateOnly(kind === "devis" ? doc.validUntil : doc.dueAt),
    notes: doc.notes,
    invoiceType,
    lines: doc.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
  }
}

export type DocumentLine = {
  description: string
  quantity: number
  unitPrice: number
}

export function calculateTotals(
  lines: DocumentLine[],
  brsEnabled: boolean,
  tvaEnabled: boolean,
  tvaExempt: boolean
) {
  const subtotalHt = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0
  )
  const brsAmount = brsEnabled ? subtotalHt * BRS_RATE : 0
  const tvaAmount = tvaEnabled && !tvaExempt ? subtotalHt * TVA_RATE : 0
  const totalTtc = subtotalHt + brsAmount + tvaAmount
  return { subtotalHt, brsAmount, tvaAmount, totalTtc }
}

// Montants d'un devis necessaires a la facturation en acompte et solde
export type QuoteAmounts = {
  reference: string
  brsEnabled: boolean
  tvaEnabled: boolean
  subtotalHt: number
  brsAmount: number
  tvaAmount: number
  totalTtc: number
}

export type InvoiceDraftLine = {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export type InvoiceDraft = {
  brsEnabled: boolean
  tvaEnabled: boolean
  subtotalHt: number
  brsAmount: number
  tvaAmount: number
  totalTtc: number
  lines: InvoiceDraftLine[]
}

export type AcompteMode = "percent" | "amount"

function formatPercent(value: number): string {
  return String(value).replace(".", ",")
}

// Facture d'acompte : chaque composante du devis multipliee par le ratio puis
// arrondie au franc ; total TTC recompose comme calculateTotals (HT + BRS + TVA).
// En montant fixe, l'ecart d'arrondi est porte par le HT pour que le TTC soit
// exactement le montant saisi.
export function computeAcompte(
  quote: QuoteAmounts,
  mode: AcompteMode,
  value: number
): InvoiceDraft {
  const ratio = mode === "percent" ? value / 100 : value / quote.totalTtc
  let subtotalHt = Math.round(quote.subtotalHt * ratio)
  const brsAmount = Math.round(quote.brsAmount * ratio)
  const tvaAmount = Math.round(quote.tvaAmount * ratio)
  let totalTtc = subtotalHt + brsAmount + tvaAmount
  if (mode === "amount") {
    subtotalHt += value - totalTtc
    totalTtc = subtotalHt + brsAmount + tvaAmount
  }
  const description =
    mode === "percent"
      ? `Acompte de ${formatPercent(value)} % sur devis ${quote.reference}`
      : `Acompte sur devis ${quote.reference}`
  return {
    brsEnabled: quote.brsEnabled,
    tvaEnabled: quote.tvaEnabled,
    subtotalHt,
    brsAmount,
    tvaAmount,
    totalTtc,
    lines: [
      { description, quantity: 1, unitPrice: subtotalHt, total: subtotalHt },
    ],
  }
}

// Bornes de l'acompte, partagees par le Dialog de conversion et la route :
// renvoie le message d'erreur, ou null si la saisie est valide
export function acompteError(
  quote: QuoteAmounts,
  mode: AcompteMode,
  value: number
): string | null {
  if (!(quote.totalTtc > 0)) {
    return "Le total TTC du devis doit etre positif pour facturer un acompte."
  }
  if (!Number.isFinite(value)) return "Saisissez une valeur."
  if (mode === "percent") {
    if (value < 1 || value > 99) {
      return "Le pourcentage doit etre compris entre 1 et 99."
    }
  } else {
    if (!Number.isInteger(value)) {
      return "Le montant doit etre un nombre entier de FCFA."
    }
    if (value <= 0 || value >= quote.totalTtc) {
      return `Le montant doit etre superieur a 0 et inferieur au total du devis (${formatAmount(quote.totalTtc)}).`
    }
  }
  const { totalTtc } = computeAcompte(quote, mode, value)
  if (totalTtc <= 0 || totalTtc >= quote.totalTtc) {
    return "Cet acompte ne laisse aucun solde a facturer."
  }
  return null
}

export class SoldeMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SoldeMismatchError"
  }
}

// Facture de solde : montants obtenus par soustraction (jamais recalcules),
// donc acompte + solde = devis exactement. Lignes du devis puis une ligne
// negative pour l'acompte deja facture.
export function computeSolde(
  quote: QuoteAmounts & {
    lines: Array<{
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
  },
  acompte: {
    reference: string
    subtotalHt: number
    brsAmount: number
    tvaAmount: number
    totalTtc: number
  }
): InvoiceDraft {
  const subtotalHt = quote.subtotalHt - acompte.subtotalHt
  const lines: InvoiceDraftLine[] = [
    ...quote.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      total: l.total,
    })),
    {
      description: `Acompte verse (${acompte.reference})`,
      quantity: 1,
      unitPrice: -acompte.subtotalHt,
      total: -acompte.subtotalHt,
    },
  ]
  const linesTotal = lines.reduce((sum, l) => sum + l.total, 0)
  // Tolerance d'un centime : seul le bruit des nombres flottants est admis
  if (Math.abs(linesTotal - subtotalHt) > 0.01) {
    throw new SoldeMismatchError(
      `Solde incoherent : lignes ${linesTotal} pour un HT de ${subtotalHt} (devis ${quote.reference}).`
    )
  }
  return {
    brsEnabled: quote.brsEnabled,
    tvaEnabled: quote.tvaEnabled,
    subtotalHt,
    brsAmount: quote.brsAmount - acompte.brsAmount,
    tvaAmount: quote.tvaAmount - acompte.tvaAmount,
    totalTtc: quote.totalTtc - acompte.totalTtc,
    lines,
  }
}

// Factures liees a un devis : ce qui compte pour l'acompte et le solde
type LinkedInvoice = { type: string; status: string }

export function activeAcompte<T extends LinkedInvoice>(invoices: T[]): T | null {
  return (
    invoices.find((i) => i.type === "acompte" && i.status !== "annulee") ?? null
  )
}

// Un solde ne peut etre facture qu'avec un acompte actif et sans facture de
// solde ou standard active sur le meme devis
export function soldeBlocker(invoices: LinkedInvoice[]): string | null {
  if (!activeAcompte(invoices)) return "Aucun acompte actif pour ce devis."
  const settled = invoices.some(
    (i) =>
      (i.type === "solde" || i.type === "standard") && i.status !== "annulee"
  )
  if (settled) return "Le solde de ce devis est deja facture."
  return null
}

export function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + " FCFA"
  )
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
