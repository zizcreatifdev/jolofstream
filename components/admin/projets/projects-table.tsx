"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  KanbanSquare,
  List,
  Pencil,
  Trash2,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ProjectForm,
  type ProjectFormInitial,
} from "@/components/admin/projets/project-form"
import {
  KANBAN_COLUMNS,
  PROJECT_STATUSES,
  PROJECT_STATUS_KEYS,
  PROJECT_TYPES,
  PROJECT_TYPE_KEYS,
  formatAmount,
  formatDate,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/projets"
import { cn } from "@/lib/utils"

type ProjectRow = {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  date: string | null
  location: string | null
  budgetEstimate: number | null
  client: {
    id: string
    name: string
    organization: string | null
  }
  _count: { quotes: number; invoices: number }
}

const PAGE_SIZE = 10

export function ProjectsTable() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | ProjectStatus>("")
  const [typeFilter, setTypeFilter] = useState<"" | ProjectType>("")
  const [view, setView] = useState<"table" | "kanban">("table")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<ProjectFormInitial | undefined>(
    undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (statusFilter) params.set("status", statusFilter)
    if (typeFilter) params.set("type", typeFilter)
    try {
      const response = await fetch(`/api/projets?${params.toString()}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
            "Erreur de chargement"
        )
      }
      const data = (await response.json()) as ProjectRow[]
      setProjects(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, typeFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    const handler = () => {
      setFormInitial(undefined)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
  const pageProjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return projects.slice(start, start + PAGE_SIZE)
  }, [projects, page])

  const handleEdit = (project: ProjectRow) => {
    setFormInitial({
      id: project.id,
      clientId: project.client.id,
      title: project.title,
      type: project.type,
      status: project.status,
      date: project.date,
      location: project.location,
      budgetEstimate: project.budgetEstimate,
    })
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/projets/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
      } else {
        setDeleteTarget(null)
        fetchProjects()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const changeStatus = async (projectId: string, status: ProjectStatus) => {
    setUpdatingStatusId(projectId)
    try {
      const response = await fetch(`/api/projets/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Mise a jour impossible."
        )
      } else {
        fetchProjects()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="projects-search"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Recherche
          </label>
          <Input
            id="projects-search"
            placeholder="Titre, client, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="projects-status"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Statut
          </label>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(value) =>
              setStatusFilter(value === "_all" ? "" : (value as ProjectStatus))
            }
          >
            <SelectTrigger id="projects-status" className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {PROJECT_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUSES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="projects-type"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Type
          </label>
          <Select
            value={typeFilter || "_all"}
            onValueChange={(value) =>
              setTypeFilter(value === "_all" ? "" : (value as ProjectType))
            }
          >
            <SelectTrigger id="projects-type" className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {PROJECT_TYPE_KEYS.map((t) => (
                <SelectItem key={t} value={t}>
                  {PROJECT_TYPES[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 self-end">
          <Button
            type="button"
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
            className={view === "table" ? "bg-zinc-900 text-white" : ""}
          >
            <List className="mr-1.5 h-4 w-4" /> Tableau
          </Button>
          <Button
            type="button"
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
            className={view === "kanban" ? "bg-zinc-900 text-white" : ""}
          >
            <KanbanSquare className="mr-1.5 h-4 w-4" /> Kanban
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {view === "table" ? (
        <TableView
          loading={loading}
          projects={pageProjects}
          empty={!loading && projects.length === 0}
          onEdit={handleEdit}
          onDelete={(p) => setDeleteTarget(p)}
          changeStatus={changeStatus}
          updatingStatusId={updatingStatusId}
          onCreate={() => {
            setFormInitial(undefined)
            setFormOpen(true)
          }}
        />
      ) : (
        <KanbanView
          loading={loading}
          projects={projects}
          changeStatus={changeStatus}
          updatingStatusId={updatingStatusId}
        />
      )}

      {view === "table" && !loading && projects.length > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <p>
            Page {page} sur {totalPages} - {projects.length} projet
            {projects.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={fetchProjects}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce projet ?</DialogTitle>
            <DialogDescription>
              Seuls les projets au statut Prospect peuvent etre supprimes.
              Cette action est definitive.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.title}</span>
              <span className="block text-zinc-500">
                {deleteTarget.client.name}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TableView({
  loading,
  projects,
  empty,
  onEdit,
  onDelete,
  changeStatus,
  updatingStatusId,
  onCreate,
}: {
  loading: boolean
  projects: ProjectRow[]
  empty: boolean
  onEdit: (p: ProjectRow) => void
  onDelete: (p: ProjectRow) => void
  changeStatus: (id: string, status: ProjectStatus) => void
  updatingStatusId: string | null
  onCreate: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden lg:table-cell">Lieu</TableHead>
            <TableHead className="hidden md:table-cell text-right">
              Budget
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skel-${i}`}>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-5 w-28" />
                </TableCell>
              </TableRow>
            ))
          ) : empty ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <p className="text-sm text-zinc-600">
                  Aucun projet pour le moment.
                </p>
                <Button
                  onClick={onCreate}
                  className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                >
                  Creer le premier projet
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    href={`/admin/projets/${project.id}`}
                    className="font-medium text-zinc-900 hover:text-[#C8151B]"
                  >
                    {project.title}
                  </Link>
                  <div className="text-xs text-zinc-500">
                    {project.client.name}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      PROJECT_TYPES[project.type].color
                    )}
                  >
                    {PROJECT_TYPES[project.type].label}
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    value={project.status}
                    onValueChange={(value) =>
                      changeStatus(project.id, value as ProjectStatus)
                    }
                    disabled={updatingStatusId === project.id}
                  >
                    <SelectTrigger className="h-8 w-[140px] border-zinc-200 bg-transparent px-2 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUS_KEYS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROJECT_STATUSES[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-zinc-700">
                  {formatDate(project.date)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-zinc-700">
                  {project.location || "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right text-sm text-zinc-700">
                  {formatAmount(project.budgetEstimate)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/admin/projets/${project.id}`}
                        aria-label={`Voir ${project.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifier ${project.title}`}
                      onClick={() => onEdit(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Supprimer ${project.title}`}
                      onClick={() => onDelete(project)}
                      disabled={project.status !== "prospect"}
                      className={cn(
                        project.status === "prospect"
                          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                          : ""
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function KanbanView({
  loading,
  projects,
  changeStatus,
  updatingStatusId,
}: {
  loading: boolean
  projects: ProjectRow[]
  changeStatus: (id: string, status: ProjectStatus) => void
  updatingStatusId: string | null
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
          >
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col)
        return (
          <div
            key={col}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">
                {PROJECT_STATUSES[col].label}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-600">
                {colProjects.length}
              </span>
            </div>
            <ul className="space-y-2">
              {colProjects.length === 0 ? (
                <li className="rounded-md border border-dashed border-zinc-300 bg-white/50 px-3 py-4 text-center text-xs text-zinc-500">
                  Aucun projet
                </li>
              ) : (
                colProjects.map((project) => {
                  const colIndex = KANBAN_COLUMNS.indexOf(project.status)
                  const prev =
                    colIndex > 0 ? KANBAN_COLUMNS[colIndex - 1] : null
                  const next =
                    colIndex >= 0 && colIndex < KANBAN_COLUMNS.length - 1
                      ? KANBAN_COLUMNS[colIndex + 1]
                      : null
                  return (
                    <li
                      key={project.id}
                      className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm"
                    >
                      <Link
                        href={`/admin/projets/${project.id}`}
                        className="block text-sm font-medium text-zinc-900 hover:text-[#C8151B]"
                      >
                        {project.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {project.client.name}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
                            PROJECT_TYPES[project.type].color
                          )}
                        >
                          {PROJECT_TYPES[project.type].label}
                        </span>
                        <span className="text-zinc-500">
                          {formatDate(project.date)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!prev || updatingStatusId === project.id}
                          onClick={() => prev && changeStatus(project.id, prev)}
                          aria-label="Statut precedent"
                          className="h-7 px-2 text-xs"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!next || updatingStatusId === project.id}
                          onClick={() => next && changeStatus(project.id, next)}
                          aria-label="Statut suivant"
                          className="h-7 px-2 text-xs"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
