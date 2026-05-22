/**
 * Palette centralisee des badges Jolof Stream
 *
 * Convention senologique :
 * - draft/neutral : zinc
 * - active/success : emerald
 * - pending/info : blue
 * - highlight/vip : yellow
 * - archived/muted : zinc-fade
 * - danger/lost : red
 *
 * Les helpers de module (lib/clients, lib/projets, lib/documents, lib/formations,
 * lib/portfolio) restent en place pour ne pas casser les rendus existants.
 * Ce fichier sert de reference canonique pour les futurs modules et permet
 * un acces direct par cle semantique.
 */

export type BadgeSemantic =
  | "draft"
  | "active"
  | "pending"
  | "highlight"
  | "muted"
  | "danger"

export const BADGE_STYLES: Record<BadgeSemantic, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-blue-50 text-blue-700",
  highlight: "bg-yellow-50 text-yellow-700",
  muted: "bg-zinc-200 text-zinc-500",
  danger: "bg-red-50 text-red-600",
}

/**
 * Mappe les statuts metier connus vers une classe Tailwind.
 * Garde-fou : tout statut inconnu retombe sur "draft".
 */
const STATUS_MAP: Record<string, BadgeSemantic> = {
  // Client
  prospect: "draft",
  actif: "active",
  inactif: "muted",
  vip: "highlight",

  // Projet
  confirme: "pending",
  en_cours: "pending",
  livre: "active",
  archive: "muted",
  perdu: "danger",

  // Quote
  brouillon: "draft",
  envoye: "pending",
  accepte: "active",
  refuse: "danger",

  // Invoice
  emise: "pending",
  payee: "active",
  partiellement_payee: "highlight",
  annulee: "muted",

  // Session formation
  ouvert: "active",
  complet: "danger",
  annule: "muted",

  // Registration
  en_attente: "highlight",
  liste_attente: "pending",
}

export function getBadgeStyle(status: string): string {
  const semantic = STATUS_MAP[status] ?? "draft"
  return BADGE_STYLES[semantic]
}

/**
 * Classes de base partagees par tous les badges (taille, forme, typographie).
 */
export const BADGE_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
