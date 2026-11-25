import type { Metadata } from "next"
import { Suspense } from "react"

import { getPortfolioWorks, getSiteContents } from "@/lib/home-data"
import { CineButton, CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"
import { FinalCtaSection } from "@/components/public/home/final-cta-section"
import { PortfolioBoard } from "@/components/public/portfolio/portfolio-board"

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Nos réalisations : événements diffusés en direct, contenus pour dirigeants, Creator Weekend et formations. Production vidéo au Sénégal.",
}

export const revalidate = 60

export default async function PortfolioPage() {
  const [contents, items] = await Promise.all([getSiteContents(["portfolio_page"]), getPortfolioWorks()])
  const page = contents.portfolio_page

  return (
    <>
      {page && (
        <section className={`bg-black pb-[90px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            {page.kicker && <Kicker>{page.kicker}</Kicker>}
            <CineHeading as="h1" title={page.title} accent={page.titleAccent} className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]" />
            {page.lead && <p className="mt-[22px] max-w-[560px] text-[18px] leading-[1.7] text-cine-cream/70">{page.lead}</p>}
          </div>
        </section>
      )}

      <section className={`bg-cine-bg pb-[100px] pt-20 text-cine-cream ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="sr-only">Réalisations</h2>
          {items.length === 0 ? (
            <div className="rounded-xl bg-cine-bg3 p-[clamp(28px,4vw,48px)] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]">
              <p className="font-display text-[clamp(32px,4vw,48px)] leading-none">Nos réalisations arrivent bientôt.</p>
              <p className="mb-6 mt-4 max-w-[560px] text-[16px] leading-[1.7] text-cine-cream/70">
                En attendant, parlons de votre projet : nous vous montrons des exemples adaptés.
              </p>
              <CineButton href="/contact" variant="red" arrow>
                Nous contacter
              </CineButton>
            </div>
          ) : (
            <Suspense fallback={null}>
              <PortfolioBoard items={items} />
            </Suspense>
          )}
        </div>
      </section>

      {page && (
        <FinalCtaSection marquee={page.finalMarquee} text={page.finalText} ctaLabel={page.finalCtaLabel} ctaHref="/contact" />
      )}
    </>
  )
}
