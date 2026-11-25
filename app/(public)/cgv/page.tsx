import type { Metadata } from "next"

import { getLegalPage } from "@/lib/legal-data"
import { LegalPage } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente des prestations et formations Jolof Stream.",
}

export const revalidate = 60

export default async function CgvPage() {
  const data = await getLegalPage("cgv_content")
  return <LegalPage kicker="Conditions générales" title="Conditions de" accent="vente" data={data} />
}
