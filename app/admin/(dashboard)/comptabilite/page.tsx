import { ComptabiliteView } from "@/components/admin/comptabilite/comptabilite-view"

export const dynamic = "force-dynamic"

export default function ComptabilitePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Comptabilité</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Recettes, dépenses, rentabilité par projet et alertes impayés.
        </p>
      </div>
      <ComptabiliteView />
    </div>
  )
}
