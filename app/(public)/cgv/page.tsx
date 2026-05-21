import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "CGV | Jolof Stream",
  description:
    "Conditions generales de vente applicables aux prestations Jolof Stream.",
}

export default function CgvPage() {
  return (
    <PagePlaceholder
      title="Conditions generales de vente"
      intro="CGV editables depuis Parametres, a valider juridiquement. Publication a l'issue du module Parametres et avant lancement."
      prompt="CGV - Prompt 11"
    />
  )
}
