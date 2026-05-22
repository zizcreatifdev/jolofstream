export const CONTRAT_STATUSES = {
  a_envoyer: { label: "A envoyer", color: "bg-zinc-100 text-zinc-600" },
  envoye: { label: "Envoye", color: "bg-blue-50 text-blue-700" },
  signe: { label: "Signe", color: "bg-green-50 text-green-700" },
  refuse: { label: "Refuse", color: "bg-red-50 text-red-600" },
  annule: { label: "Annule", color: "bg-zinc-200 text-zinc-500" },
} as const

export type ContratStatus = keyof typeof CONTRAT_STATUSES

export const CONTRAT_STATUS_KEYS = Object.keys(
  CONTRAT_STATUSES
) as ContratStatus[]

export const TEMPLATE_TYPES = {
  prestation_services: "Prestation de services",
  ceo_content: "CEO Content Package",
  creator_weekend: "Creator Weekend",
  formation: "Convention de formation",
  personnalise: "Contrat personnalise",
} as const

export type TemplateType = keyof typeof TEMPLATE_TYPES

export const TEMPLATE_TYPE_KEYS = Object.keys(
  TEMPLATE_TYPES
) as TemplateType[]

export const TEMPLATE_TITLES: Record<TemplateType, string> = {
  prestation_services: "CONTRAT DE PRESTATION DE SERVICES",
  ceo_content: "CONTRAT CEO CONTENT PACKAGE",
  creator_weekend: "CONTRAT CREATOR WEEKEND",
  formation: "CONVENTION DE FORMATION",
  personnalise: "CONTRAT DE PRESTATION",
}

export function contratReference(id: string): string {
  return id.slice(-8).toUpperCase()
}
