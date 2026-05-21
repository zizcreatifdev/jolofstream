"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
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
  ClientForm,
  type ClientFormInitial,
} from "@/components/admin/clients/client-form"
import {
  acquisitionLabels,
  clientStatusBadge,
  clientStatusLabels,
  clientTypeBadge,
  clientTypeLabels,
  type AcquisitionChannel,
  type ClientStatus,
  type ClientType,
} from "@/lib/clients"
import { cn } from "@/lib/utils"

type ClientRow = {
  id: string
  type: ClientType
  name: string
  email: string | null
  organization: string | null
  acquisitionChannel: string | null
  status: ClientStatus
  tvaExempt: boolean
  notes: string | null
  tags: string[]
  createdAt: string
  _count: { projects: number; quotes: number; invoices: number }
}

const PAGE_SIZE = 10

export function ClientsTable() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | ClientStatus>("")
  const [typeFilter, setTypeFilter] = useState<"" | ClientType>("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<ClientFormInitial | undefined>(
    undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (statusFilter) params.set("status", statusFilter)
    if (typeFilter) params.set("type", typeFilter)
    try {
      const response = await fetch(`/api/clients?${params.toString()}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
            "Erreur de chargement"
        )
      }
      const data = (await response.json()) as ClientRow[]
      setClients(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, typeFilter])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    const handler = () => {
      setFormInitial(undefined)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE))
  const pageClients = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return clients.slice(start, start + PAGE_SIZE)
  }, [clients, page])

  const handleEdit = (client: ClientRow) => {
    setFormInitial({
      id: client.id,
      type: client.type,
      name: client.name,
      email: client.email ?? "",
      phone: "",
      organization: client.organization ?? "",
      acquisitionChannel: client.acquisitionChannel ?? "",
      status: client.status,
      tvaExempt: client.tvaExempt,
      notes: client.notes ?? "",
      tags: client.tags,
    })
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/clients/${deleteTarget.id}`, {
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
        fetchClients()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="clients-search"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Recherche
          </label>
          <Input
            id="clients-search"
            placeholder="Nom, email, organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="clients-status"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Statut
          </label>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(value) =>
              setStatusFilter(value === "_all" ? "" : (value as ClientStatus))
            }
          >
            <SelectTrigger id="clients-status" className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {(Object.keys(clientStatusLabels) as ClientStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {clientStatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="clients-type"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Type
          </label>
          <Select
            value={typeFilter || "_all"}
            onValueChange={(value) =>
              setTypeFilter(value === "_all" ? "" : (value as ClientType))
            }
          >
            <SelectTrigger id="clients-type" className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {(Object.keys(clientTypeLabels) as ClientType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {clientTypeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Projets</TableHead>
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
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-5 w-8" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucun client pour le moment.
                  </p>
                  <Button
                    onClick={() => {
                      setFormInitial(undefined)
                      setFormOpen(true)
                    }}
                    className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                  >
                    Ajouter le premier client
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageClients.map((client) => {
                const channel = client.acquisitionChannel as
                  | AcquisitionChannel
                  | null
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-900">
                        {client.name}
                      </div>
                      {client.organization && (
                        <div className="text-xs text-zinc-500">
                          {client.organization}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          clientTypeBadge[client.type]
                        )}
                      >
                        {clientTypeLabels[client.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          clientStatusBadge[client.status]
                        )}
                      >
                        {clientStatusLabels[client.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {channel ? acquisitionLabels[channel] ?? channel : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-zinc-700">
                      {client._count.projects}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            aria-label={`Voir ${client.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Modifier ${client.name}`}
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Supprimer ${client.name}`}
                          onClick={() => setDeleteTarget(client)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && clients.length > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <p>
            Page {page} sur {totalPages} -{" "}
            {clients.length} client{clients.length > 1 ? "s" : ""}
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

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={fetchClients}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Si le client a des projets, devis
              ou factures associes, la suppression sera refusee.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.name}</span>
              {deleteTarget.organization && (
                <span className="text-zinc-500">
                  {" "}
                  - {deleteTarget.organization}
                </span>
              )}
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
