import type { Metadata } from "next"

import { getLegalPage } from "@/lib/legal-data"
import { LegalPage } from "@/components/legal/legal-page"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Conditions générales de vente",
  description:
    "Conditions générales de vente des prestations et formations Jolof Stream.",
  path: "/cgv",
})

export const revalidate = 60

export default async function CgvPage() {
  const data = await getLegalPage("cgv_content")
  return <LegalPage kicker="Conditions générales" title="Conditions de" accent="vente" data={data} />
}
