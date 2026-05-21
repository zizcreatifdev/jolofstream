import type { Metadata } from "next"

import { PageHero } from "@/components/public/page-hero"
import {
  PortfolioGrid,
  type PortfolioItem,
} from "@/components/public/portfolio-grid"

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Streaming live, CEO Content, Creator Weekend, formations : explorez nos realisations.",
}

// Donnees remplacees par les vraies realisations depuis la DB au Prompt 10
const items: PortfolioItem[] = [
  {
    id: "gala-techdakar-2026",
    title: "Gala d'entreprise TechDakar 2026",
    type: "Streaming Live",
    description: "Diffusion multi-plateformes, 4 cameras, 6h de live HD.",
    tall: true,
  },
  {
    id: "portrait-ceo-conseil-ndar",
    title: "Portrait CEO - Cabinet Conseil Ndar",
    type: "CEO Content",
    description: "Serie de capsules video mensuelles pour un dirigeant.",
  },
  {
    id: "studio-teranga-creator-weekend",
    title: "Creator Weekend - Studio Teranga",
    type: "Creator Weekend",
    description: "2 jours de tournage, 25 livrables prets pour Instagram.",
  },
  {
    id: "formation-streaming-avance",
    title: "Formation Streaming Avance",
    type: "Formations",
    description: "Promotion 2026, 15 participants, retours tres positifs.",
    tall: true,
  },
  {
    id: "conference-cesag",
    title: "Conference Internationale CESAG",
    type: "Streaming Live",
    description: "Streaming bilingue, regie complete, replay archive.",
  },
  {
    id: "contenus-mensuel-walo",
    title: "Contenus mensuel - Agence Walo",
    type: "CEO Content",
    description: "8 capsules video et reporting performance mensuel.",
  },
]

export default function PortfolioPublicPage() {
  return (
    <>
      <PageHero
        title="Nos realisations"
        subtitle="Un apercu de nos projets recents en streaming live, contenu corporate et coaching createurs."
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PortfolioGrid items={items} />
        </div>
      </section>
    </>
  )
}
