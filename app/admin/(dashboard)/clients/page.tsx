import { ClientsTable } from "@/components/admin/clients/clients-table"

export default function ClientsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Clients et CRM</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fiches clients, leads entrants, historique des projets et facturation.
        </p>
      </div>
      <ClientsTable />
    </div>
  )
}
