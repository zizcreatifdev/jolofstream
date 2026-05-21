import { Suspense } from "react"

import { DocumentsTabs } from "@/components/admin/documents/documents-tabs"

export default function DevisFacturesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Devis et Factures</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generez devis et factures avec preview PDF temps reel, conversion et
          avoirs.
        </p>
      </div>
      <Suspense fallback={null}>
        <DocumentsTabs />
      </Suspense>
    </div>
  )
}
