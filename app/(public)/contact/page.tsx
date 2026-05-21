import type { Metadata } from "next"

import { PagePlaceholder } from "@/components/public/page-placeholder"

export const metadata: Metadata = {
  title: "Contact | Jolof Stream",
  description:
    "Demande de devis, coordonnees, FAQ : prenons contact pour votre prochain evenement.",
}

export default function ContactPage() {
  return (
    <PagePlaceholder
      title="Contact"
      intro="Formulaire de demande de devis, coordonnees directes, reseaux sociaux et FAQ. Soumission du formulaire creera un lead dans le CRM."
      prompt="Page Contact - Prompt 05"
    />
  )
}
