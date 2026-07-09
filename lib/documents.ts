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
