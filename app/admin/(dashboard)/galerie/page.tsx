import { AlbumsList } from "@/components/admin/galerie/albums-list"

export default function GaleriePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Galerie</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Albums photos publiés sur /galerie : événements, formations et coulisses.
        </p>
      </div>
      <AlbumsList />
    </div>
  )
}
