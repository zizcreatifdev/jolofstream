import {
  AboutStatsSection,
  FeaturedServicesSection,
  FinalCtaSection,
  FormationsPreviewSection,
  HeroSection,
  PortfolioPreviewSection,
  ServiceBandSection,
  TestimonialsSection,
  type FormationSession,
  type AboutStatsData,
} from "@/components/public/home-sections"
import { JsonLd } from "@/components/public/json-ld"
import { prisma } from "@/lib/prisma"
import { PARAM_DEFAULTS, type AboutStat } from "@/lib/parametres"

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
      dateStart: s.dateStart.toISOString(),
      dateEnd: s.dateEnd.toISOString(),
      location: s.location,
      maxSeats: s.maxSeats,
      price: s.price,
    }))
  } catch {
    return []
  }
}

async function getAboutData(): Promise<{
  heroImageUrl: string
  heroBgImage: string
  stats: AboutStatsData
}> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: ["about_hero_image", "about_stats", "hero_background_image"],
        },
      },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))
    const heroImageUrl = map.get("about_hero_image") ?? ""
    const heroBgImage = map.get("hero_background_image") ?? ""
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
    return { heroImageUrl, heroBgImage, stats }
  } catch {
    return { heroImageUrl: "", heroBgImage: "", stats: null }
  }
}

export default async function HomePage() {
  const [sessions, about] = await Promise.all([
    getProchainsSessions(),
    getAboutData(),
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
      <HeroSection heroBgImage={about.heroBgImage} />
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

// Keep PARAM_DEFAULTS reference for future use
void PARAM_DEFAULTS
