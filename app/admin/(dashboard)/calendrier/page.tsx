import { CalendrierView } from "@/components/admin/calendrier/calendrier-view"

export const dynamic = "force-dynamic"

export default function CalendrierPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Calendrier</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vue partagee des projets, formations et taches a venir.
        </p>
      </div>
      <CalendrierView />
    </div>
  )
}
