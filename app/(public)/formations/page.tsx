import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "Formations | Jolof Stream",
  description:
    "Sessions de formation ouvertes au public a Dakar : captation, streaming, production de contenus.",
}

export default function FormationsPublicPage() {
  return (
    <PagePlaceholder
      title="Formations"
      intro="Sessions ouvertes, places restantes, tarifs, formulaire d'inscription avec flux Wave Business : tout sera publie ici une fois le module Formations branche."
      prompt="Page Formations - Prompt 05"
    />
  )
}
