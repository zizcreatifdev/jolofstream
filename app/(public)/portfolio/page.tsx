import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "Portfolio | Jolof Stream",
  description:
    "Streaming live, CEO Content, Creator Weekend, formations : explorez nos realisations.",
}

export default function PortfolioPublicPage() {
  return (
    <PagePlaceholder
      title="Portfolio"
      intro="Realisations filtrables par type avec miniatures photos ou YouTube. La galerie complete sera publiee a l'issue du module Portfolio."
      prompt="Page Portfolio - Prompt 05"
    />
  )
}
