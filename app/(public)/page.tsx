import {
  AboutStatsSection,
  FeaturedServicesSection,
  FinalCtaSection,
  FormationsPreviewSection,
  PortfolioPreviewSection,
  ServiceBandSection,
  TestimonialsSection,
  type FormationSession,
  type AboutStatsData,
} from "@/components/public/home-sections"
import { HeroCarousel } from "@/components/public/hero/hero-carousel"
import { JsonLd } from "@/components/public/json-ld"
import { prisma } from "@/lib/prisma"
import { type AboutStat } from "@/lib/parametres"
import {
  HERO_DURATION_DEFAULT,
  parseSlideDuration,
  toHeroSlideView,
  type HeroSlideView,
} from "@/lib/hero-slides"

export const revalidate = 30

async function getProchainsSessions(): Promise<FormationSession[]> {
  try {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        status: "ouvert",
      },
      orderBy: { dateStart: "asc" },
      take: 2,
    })
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      dateStart: s.dateStart ? s.dateStart.toISOString() : null,
      dateEnd: s.dateEnd ? s.dateEnd.toISOString() : null,
      location: s.location,
      maxSeats: s.maxSeats,
      price: s.price,
    }))
  } catch {
    return []
  }
}

// Slides actives du hero (ordre de l'admin) et duree d'une slide
async function getHeroData(): Promise<{
  slides: HeroSlideView[]
  duration: number
}> {
  try {
    const [slides, setting] = await Promise.all([
      prisma.heroSlide.findMany({
        where: { active: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.setting.findUnique({ where: { key: "hero_slide_duration" } }),
    ])
    return {
      slides: slides.map(toHeroSlideView),
      duration: parseSlideDuration(setting?.value),
    }
  } catch {
    // Base indisponible : hero statique de repli
    return { slides: [], duration: HERO_DURATION_DEFAULT }
  }
}

async function getAboutData(): Promise<{
  heroImageUrl: string
  stats: AboutStatsData
}> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: ["about_hero_image", "about_stats"],
        },
      },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))
    const heroImageUrl = map.get("about_hero_image") ?? ""
    let stats: AboutStatsData = null
    const rawStats = map.get("about_stats")
    if (rawStats) {
      try {
        const parsed = JSON.parse(rawStats) as AboutStat[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          stats = parsed
        }
      } catch {
        // garde le fallback
      }
    }
    return { heroImageUrl, stats }
  } catch {
    return { heroImageUrl: "", stats: null }
  }
}

export default async function HomePage() {
  const [sessions, about, hero] = await Promise.all([
    getProchainsSessions(),
    getAboutData(),
    getHeroData(),
  ])

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Jolof Stream",
          url: "https://jolofstream.com",
          logo: "https://jolofstream.com/logos/Logo_JolofStream_couleur.png",
          description:
            "Agence de captation et diffusion en direct. Dakar, Senegal.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Dakar",
            addressCountry: "SN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+221-70-241-48-48",
            contactType: "customer service",
            availableLanguage: ["French"],
          },
          sameAs: [],
        }}
      />
      <HeroCarousel slides={hero.slides} duration={hero.duration} />
      <ServiceBandSection />
      <AboutStatsSection
        heroImageUrl={about.heroImageUrl}
        stats={about.stats}
      />
      <FeaturedServicesSection />
      <PortfolioPreviewSection />
      <FormationsPreviewSection sessions={sessions} />
      <TestimonialsSection />
      <FinalCtaSection />
    </>
  )
}
