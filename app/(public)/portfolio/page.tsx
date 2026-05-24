import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PageHero } from "@/components/public/page-hero"
import {
  PortfolioGrid,
  type PortfolioItem,
} from "@/components/public/portfolio-grid"

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Decouvrez nos realisations : evenements diffuses en direct, contenus CEO, Creator Weekend. Production video professionnelle au Senegal.",
}

export const revalidate = 60

type DbPortfolioItem = {
  id: string
  title: string
  type: "streaming_live" | "ceo_content" | "creator_weekend" | "formations"
  description: string | null
  mediaType: "photo" | "youtube"
  mediaUrl: string
  displayOrder: number
}

const typeMap: Record<DbPortfolioItem["type"], PortfolioItem["type"]> = {
  streaming_live: "Streaming Live",
  ceo_content: "CEO Content",
  creator_weekend: "Creator Weekend",
  formations: "Formations",
}

async function getPortfolio(): Promise<PortfolioItem[] | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/portfolio?published=true`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as DbPortfolioItem[]
    if (!Array.isArray(data) || data.length === 0) return null
    return data.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: typeMap[item.type],
      description: item.description ?? "",
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      tall: index % 3 === 0,
    }))
  } catch {
    return null
  }
}

export default async function PortfolioPublicPage() {
  const items = (await getPortfolio()) ?? []

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
