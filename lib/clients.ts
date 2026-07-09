export type ClientType =
  | "entreprise"
  | "particulier"
  | "createur"
  | "association"

export type ClientStatus =
  | "prospect"
  | "client"
  | "actif"
  | "inactif"
  | "vip"

export type AcquisitionChannel =
  | "site_web"
  | "recommandation"
  | "reseaux_sociaux"
  | "prospection"
  | "autre"

export const clientTypeLabels: Record<ClientType, string> = {
  entreprise: "Entreprise",
  particulier: "Particulier",
  createur: "Createur",
  association: "Association",
}

export const clientStatusLabels: Record<ClientStatus, string> = {
  prospect: "Prospect",
  client: "Client",
  actif: "Actif",
  inactif: "Inactif",
  vip: "VIP",
}

export const acquisitionLabels: Record<AcquisitionChannel, string> = {
  site_web: "Site web",
  recommandation: "Recommandation",
  reseaux_sociaux: "Reseaux sociaux",
  prospection: "Prospection",
  autre: "Autre",
}

export const clientTypeBadge: Record<ClientType, string> = {
  entreprise: "bg-blue-100 text-blue-700",
  particulier: "bg-zinc-100 text-zinc-700",
  createur: "bg-violet-100 text-violet-700",
  association: "bg-emerald-100 text-emerald-700",
}

export const clientStatusBadge: Record<ClientStatus, string> = {
  prospect: "bg-zinc-100 text-zinc-700",
  client: "bg-blue-100 text-blue-700",
  actif: "bg-emerald-100 text-emerald-700",
  inactif: "bg-red-100 text-red-700",
  vip: "bg-[#F5B800]/20 text-[#8a6500]",
}

export function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "JS"
  )
}
