export const LISTES_PREDEFINIES = [
  "clients",
  "prospects",
  "formations",
  "newsletter",
  "vip",
] as const

export type ListePredefinie = (typeof LISTES_PREDEFINIES)[number]
export type ListeMarketing = ListePredefinie | string

export const LISTE_LABELS: Record<string, string> = {
  clients: "Clients",
  prospects: "Prospects",
  formations: "Formations",
  newsletter: "Newsletter",
  vip: "VIP",
}

export const LISTE_COLORS: Record<string, string> = {
  clients: "bg-blue-50 text-blue-700",
  prospects: "bg-yellow-50 text-yellow-700",
  formations: "bg-purple-50 text-purple-700",
  newsletter: "bg-green-50 text-green-700",
  vip: "bg-amber-50 text-amber-700",
}

export function getListeColor(liste: string): string {
  return LISTE_COLORS[liste] ?? "bg-zinc-100 text-zinc-600"
}

export function getListeLabel(liste: string): string {
  return LISTE_LABELS[liste] ?? liste
}

export const IMPORT_MAX_ROWS = 500
