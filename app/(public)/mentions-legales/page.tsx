import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "Mentions legales | Jolof Stream",
  description:
    "Editeur, hebergeur, donnees de l'entreprise et informations legales obligatoires.",
}

export default function MentionsLegalesPage() {
  return (
    <PagePlaceholder
      title="Mentions legales"
      intro="Raison sociale, NINEA, RC, adresse, contact, hebergeur. Donnees injectees automatiquement depuis Parametres une fois l'agence renseignee."
      prompt="Mentions legales - Prompt 11"
    />
  )
}
