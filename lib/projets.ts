export const PROJECT_TYPES = {
  streaming_live: {
    label: "Streaming Live",
    color: "bg-red-100 text-red-700",
  },
  ceo_content: {
    label: "CEO Content",
    color: "bg-blue-100 text-blue-700",
  },
  creator_weekend: {
    label: "Creator Weekend",
    color: "bg-purple-100 text-purple-700",
  },
  gestion_reseaux: {
    label: "Gestion reseaux",
    color: "bg-green-100 text-green-700",
  },
  autre: {
    label: "Autre",
    color: "bg-zinc-100 text-zinc-700",
  },
} as const

export const PROJECT_STATUSES = {
  prospect: { label: "Prospect", color: "bg-zinc-100 text-zinc-700" },
  confirme: { label: "Confirme", color: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
  livre: { label: "Livre", color: "bg-green-100 text-green-700" },
  archive: { label: "Archive", color: "bg-zinc-200 text-zinc-500" },
  perdu: { label: "Perdu", color: "bg-red-100 text-red-500" },
} as const

export type ProjectType = keyof typeof PROJECT_TYPES
export type ProjectStatus = keyof typeof PROJECT_STATUSES

export const PROJECT_TYPE_KEYS = Object.keys(PROJECT_TYPES) as ProjectType[]
export const PROJECT_STATUS_KEYS = Object.keys(
  PROJECT_STATUSES
) as ProjectStatus[]

export const KANBAN_COLUMNS: ProjectStatus[] = [
  "prospect",
  "confirme",
  "en_cours",
  "livre",
]

export const EXPENSE_CATEGORIES = {
  equipement: "Equipement",
  transport: "Transport",
  sous_traitance: "Sous-traitance",
  charges_fixes: "Charges fixes",
  marketing: "Marketing",
  divers: "Divers",
} as const

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES
export const EXPENSE_CATEGORY_KEYS = Object.keys(
  EXPENSE_CATEGORIES
) as ExpenseCategory[]

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
  if (!value) return "Non definie"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "Non definie"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
