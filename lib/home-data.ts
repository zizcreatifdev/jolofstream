import { prisma } from "@/lib/prisma"
import {
  SITE_CONTENT_KEYS,
  parseSiteContent,
  type SiteContentKey,
  type SiteContentMap,
} from "@/lib/site-content"
import { HOME_TESTIMONIALS_MAX, toTestimonialView, type TestimonialView } from "@/lib/testimonials"
import {
  PORTFOLIO_TYPES,
  extractYoutubeId,
  youtubeThumbnailHq,
  type PortfolioType,
} from "@/lib/portfolio"

// Lectures en base de l'accueil et de la page Services (composants serveur).
// Chaque lecture est independante : une erreur masque sa seule section.

export type SiteContents = { [K in SiteContentKey]: SiteContentMap[K] | null }

export async function getSiteContents(
  keys: SiteContentKey[] = SITE_CONTENT_KEYS
): Promise<SiteContents> {
  const empty = Object.fromEntries(SITE_CONTENT_KEYS.map((k) => [k, null])) as SiteContents
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    })
    const result = { ...empty }
    for (const row of rows) {
      const key = row.key as SiteContentKey
      ;(result as Record<SiteContentKey, unknown>)[key] = parseSiteContent(key, row.value)
    }
    return result
  } catch (error) {
    console.warn("[home-data] contenus indisponibles", error)
    return empty
  }
}

export type WorkItem = {
  id: string
  title: string
  typeLabel: string
  thumbnailUrl: string | null
  mediaType: "photo" | "youtube"
  mediaUrl: string
  youtubeId: string | null
}

// 6 premieres realisations publiees, ordre de l'admin
export async function getHomeWorks(): Promise<WorkItem[]> {
  try {
    const rows = await prisma.portfolioItem.findMany({
      where: { published: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 6,
    })
    return rows.map((r) => {
      const youtubeId = r.mediaType === "youtube" ? extractYoutubeId(r.mediaUrl) : null
      const thumbnailUrl =
        r.thumbnailUrl ||
        (youtubeId ? youtubeThumbnailHq(youtubeId) : r.mediaType === "photo" ? r.mediaUrl : null)
      return {
        id: r.id,
        title: r.title,
        typeLabel: PORTFOLIO_TYPES[r.type as PortfolioType]?.publicLabel ?? r.type,
        thumbnailUrl,
        mediaType: r.mediaType === "youtube" ? "youtube" : "photo",
        mediaUrl: r.mediaUrl,
        youtubeId,
      }
    })
  } catch (error) {
    console.warn("[home-data] portfolio indisponible", error)
    return []
  }
}

export async function getPublishedTestimonials(
  context: "GENERAL" | "FORMATION",
  take = HOME_TESTIMONIALS_MAX
): Promise<TestimonialView[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { context, published: true, consent: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take,
    })
    return rows.map(toTestimonialView)
  } catch (error) {
    console.warn("[home-data] temoignages indisponibles", error)
    return []
  }
}

export type OfferView = {
  id: string
  serviceType: string
  name: string
  price: number | null
  priceLabel: string | null
  features: string[]
  isPopular: boolean
}

// Offres actives du catalogue, par type (ordre de l'admin)
export async function getActiveOffers(): Promise<OfferView[]> {
  try {
    const rows = await prisma.offer.findMany({
      where: { active: true },
      orderBy: [{ serviceType: "asc" }, { displayOrder: "asc" }],
    })
    return rows.map((o) => ({
      id: o.id,
      serviceType: o.serviceType,
      name: o.name,
      price: o.price,
      priceLabel: o.priceLabel,
      features: o.features,
      isPopular: o.isPopular,
    }))
  } catch (error) {
    console.warn("[home-data] offres indisponibles", error)
    return []
  }
}

// Plus petit prix des offres actives d'un type (null : sur devis)
export function lowestPrice(offers: OfferView[], serviceType: string): OfferView | null {
  const priced = offers.filter((o) => o.serviceType === serviceType && o.price !== null)
  if (priced.length === 0) return null
  return priced.reduce((min, o) => ((o.price ?? 0) < (min.price ?? 0) ? o : min))
}

