import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "A propos | Jolof Stream",
  description:
    "Histoire, mission, valeurs, equipe et chiffres cles de l'agence senegalaise de captation et streaming live.",
}

export default function AProposPage() {
  return (
    <PagePlaceholder
      title="A propos"
      intro="Histoire de Jolof Stream, mission, valeurs, equipe et chiffres cles. Contenu editable depuis Parametres et publie ici a l'issue du module Site public."
      prompt="Page A propos - Prompt 05"
    />
  )
}
