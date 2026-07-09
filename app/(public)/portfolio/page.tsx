import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PageHero } from "@/components/public/page-hero"
import {
  PortfolioGrid,
  type PortfolioItem,
} from "@/components/public/portfolio-grid"
import { prisma } from "@/lib/prisma"
import { PORTFOLIO_TYPES, type PortfolioType } from "@/lib/portfolio"

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Decouvrez nos realisations : evenements diffuses en direct, contenus CEO, Creator Weekend. Production video professionnelle au Senegal.",
}

export const revalidate = 60

async function getPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const rows = await prisma.portfolioItem.findMany({
      where: { published: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    })
    return rows.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: PORTFOLIO_TYPES[item.type as PortfolioType].publicLabel,
      description: item.description ?? "",
      mediaType: item.mediaType as "photo" | "youtube",
      mediaUrl: item.mediaUrl,
      tall: index % 3 === 0,
    }))
  } catch {
    return []
  }
}

export default async function PortfolioPublicPage() {
  const items = await getPortfolioItems()

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title='Nos <em class="italic text-[#F5B800]">realisations</em>.'
        subtitle="Un apercu de nos projets recents en streaming live, contenu corporate et coaching createurs."
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-lg font-light text-ink-3">
                Nos realisations arrivent bientot.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#C8151B] transition-all hover:gap-3"
              >
                Nous contacter
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <PortfolioGrid items={items} />
          )}
        </div>
      </section>
    </>
  )
}
