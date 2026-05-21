import { CatalogueBoard } from "@/components/admin/catalogue/catalogue-board"

export default function CataloguePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Catalogue offres</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Forfaits CEO Content Package et Creator Weekend publies sur le site
          public.
        </p>
      </div>
      <CatalogueBoard />
    </div>
  )
}
