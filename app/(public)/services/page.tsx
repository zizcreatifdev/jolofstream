import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "Services | Jolof Stream",
  description:
    "Captation Live, CEO Content Package, Creator Weekend, gestion reseaux : decouvrez nos offres detaillees.",
}

export default function ServicesPage() {
  return (
    <PagePlaceholder
      title="Nos services"
      intro="Captation & Streaming Live, CEO Content Package, Creator Weekend et gestion publication reseaux. Chaque offre detaillee avec processus, livrables et tarifs sera publiee ici."
      prompt="Page Services - Prompt 05"
    />
  )
}
