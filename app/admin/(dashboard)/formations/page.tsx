import { SessionsTable } from "@/components/admin/formations/sessions-table"

export default function FormationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Formations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sessions ouvertes, inscrits, confirmation de paiement Wave et liste
          d&apos;attente.
        </p>
      </div>
      <SessionsTable />
    </div>
  )
}
