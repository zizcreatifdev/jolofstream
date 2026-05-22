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
