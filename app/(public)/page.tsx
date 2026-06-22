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
  type HeroStats,
} from "@/components/public/home-sections"
import { JsonLd } from "@/components/public/json-ld"
import { prisma } from "@/lib/prisma"
import { PARAM_DEFAULTS, PARAM_KEYS, type AboutStat } from "@/lib/parametres"

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

const HERO_STAT_KEYS = [
  PARAM_KEYS.hero_stat_1_value,
  PARAM_KEYS.hero_stat_1_label,
  PARAM_KEYS.hero_stat_2_value,
  PARAM_KEYS.hero_stat_2_label,
  PARAM_KEYS.hero_stat_3_value,
  PARAM_KEYS.hero_stat_3_label,
] as const

function buildHeroStats(map: Map<string, string>): HeroStats {
  const pick = (key: (typeof HERO_STAT_KEYS)[number]) =>
    (map.get(key)?.trim() || PARAM_DEFAULTS[key] || "").trim()
  return {
    stat1: {
      value: pick(PARAM_KEYS.hero_stat_1_value),
      label: pick(PARAM_KEYS.hero_stat_1_label),
    },
    stat2: {
      value: pick(PARAM_KEYS.hero_stat_2_value),
      label: pick(PARAM_KEYS.hero_stat_2_label),
    },
    stat3: {
      value: pick(PARAM_KEYS.hero_stat_3_value),
      label: pick(PARAM_KEYS.hero_stat_3_label),
    },
  }
}

async function getAboutData(): Promise<{
  heroImageUrl: string
  heroBgImage: string
  stats: AboutStatsData
  heroStats: HeroStats
}> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "about_hero_image",
            "about_stats",
            "hero_background_image",
            ...HERO_STAT_KEYS,
          ],
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
    return { heroImageUrl, heroBgImage, stats, heroStats: buildHeroStats(map) }
  } catch {
    return {
      heroImageUrl: "",
      heroBgImage: "",
      stats: null,
      heroStats: buildHeroStats(new Map()),
    }
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
      <HeroSection heroBgImage={about.heroBgImage} stats={about.heroStats} />
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
