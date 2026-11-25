import type { Metadata } from "next"

import { getLegalPage } from "@/lib/legal-data"
import { LegalPage } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur du site, hébergement, propriété intellectuelle et données personnelles.",
}

export const revalidate = 60

export default async function MentionsLegalesPage() {
  const data = await getLegalPage("mentions_legales_content")
  return <LegalPage kicker="Informations légales" title="Mentions" accent="légales" data={data} withEditor />
}
