import { Suspense } from "react"

import { ContratsTable } from "@/components/admin/contrats/contrats-table"

export const dynamic = "force-dynamic"

export default function ContratsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Contrats</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Bibliotheque des contrats client, modeles pre-remplis et suivi des
          statuts.
        </p>
      </div>
      <Suspense fallback={null}>
        <ContratsTable />
      </Suspense>
    </div>
  )
}
