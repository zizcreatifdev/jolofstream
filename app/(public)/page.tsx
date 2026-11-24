import { HeroCarousel } from "@/components/public/hero/hero-carousel"
import { JsonLd } from "@/components/public/json-ld"
import { ManifestoSection } from "@/components/public/home/manifesto-section"
import { SkillsSection } from "@/components/public/home/skills-section"
import { WorksSection } from "@/components/public/home/works-section"
import { OffersSection } from "@/components/public/home/offers-section"
import { TestimonialsSection } from "@/components/public/home/testimonials-section"
import { FinalCtaSection } from "@/components/public/home/final-cta-section"
import { prisma } from "@/lib/prisma"
import { getSiteContact } from "@/lib/site-settings"
import {
  getActiveOffers,
  getHomeWorks,
  getNextSessions,
  getPublishedTestimonials,
  getSiteContents,
} from "@/lib/home-data"
import {
  HERO_DURATION_DEFAULT,
  parseSlideDuration,
  toHeroSlideView,
  type HeroSlideView,
} from "@/lib/hero-slides"

export const revalidate = 30

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"

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

// Ordre de la maquette : Hero, Manifeste, Savoir-faire, Realisations, Offres,
// Temoignages, Appel final. Chaque section se masque sans donnee.
export default async function HomePage() {
  const [hero, contents, works, offers, sessions, testimonials, contact] =
    await Promise.all([
      getHeroData(),
      getSiteContents(),
      getHomeWorks(),
      getActiveOffers(),
      getNextSessions(),
      getPublishedTestimonials("GENERAL"),
      getSiteContact(),
    ])
  const sections = contents.home_sections
  const skills = contents.home_skills
  const finalCta = contents.home_final_cta

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: contact.companyName,
          url: SITE_URL,
          logo: `${SITE_URL}/logos/Logo_JolofStream_couleur.png`,
          description: "Agence de captation et diffusion en direct. Dakar, Sénégal.",
          ...(contact.email ? { email: contact.email } : {}),
          ...(contact.address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: contact.address,
                  addressCountry: "SN",
                },
              }
            : {}),
          ...(contact.phone
            ? {
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: contact.phoneHref,
                  contactType: "customer service",
                  availableLanguage: ["French"],
                },
              }
            : {}),
          sameAs: contact.socials.map((s) => s.href).filter((href) => href.startsWith("https://")),
        }}
      />
      <HeroCarousel slides={hero.slides} duration={hero.duration} />
      <ManifestoSection content={contents.home_manifesto} />
      {skills && skills.items.length > 0 && <SkillsSection content={skills} />}
      {sections && works.length > 0 && (
        <WorksSection
          items={works}
          heading={{
            kicker: sections.worksKicker,
            title: sections.worksTitle,
            accent: sections.worksTitleAccent,
            text: sections.worksText,
          }}
        />
      )}
      {sections && (
        <OffersSection
          sections={sections}
          services={contents.services_content}
          offers={offers}
          sessions={sessions}
        />
      )}
      {sections && <TestimonialsSection sections={sections} testimonials={testimonials} />}
      {finalCta && (
        <FinalCtaSection
          marquee={finalCta.marquee}
          text={finalCta.text}
          ctaLabel={finalCta.cta1Label}
          ctaHref={finalCta.cta1Href}
          phone={contact.phone}
          phoneHref={contact.phoneHref}
        />
      )}
    </>
  )
}
