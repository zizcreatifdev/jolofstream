// Types d'offres du catalogue (modele Offer.serviceType), un par chapitre
// de la page Services
export const OFFER_SERVICE_TYPES = [
  "live",
  "ceo_content",
  "creator_weekend",
  "social",
] as const

export type OfferServiceType = (typeof OFFER_SERVICE_TYPES)[number]

export const OFFER_SERVICE_LABELS: Record<OfferServiceType, string> = {
  live: "Captation et streaming live",
  ceo_content: "CEO Content Package",
  creator_weekend: "Creator Weekend",
  social: "Publication réseaux",
}

// Libelle de prix propose a la creation d'une offre
export const OFFER_DEFAULT_PRICE_LABEL: Record<OfferServiceType, string> = {
  live: "par événement",
  ceo_content: "par mois",
  creator_weekend: "par session",
  social: "par mois",
}

export function formatOfferPrice(price: number | null, priceLabel: string | null): string {
  if (price === null || price === undefined) return "Sur devis"
  const amount = `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(price).replace(/ | /g, " ")} FCFA`
  return priceLabel ? `${amount} ${priceLabel}` : amount
}
