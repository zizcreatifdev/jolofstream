import { ProjectsTable } from "@/components/admin/projets/projects-table"

export default function ProjetsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Projets</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pipeline complet des projets, du prospect au livre.
        </p>
      </div>
      <ProjectsTable />
    </div>
  )
}
