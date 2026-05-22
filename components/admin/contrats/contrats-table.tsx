"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  PlusCircle,
  Send,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ContratForm } from "@/components/admin/contrats/contrat-form"
import {
  CONTRAT_STATUSES,
  CONTRAT_STATUS_KEYS,
  TEMPLATE_TYPES,
  contratReference,
  type ContratStatus,
} from "@/lib/contrats"
import { cn } from "@/lib/utils"

type Contrat = {
  id: string
  status: ContratStatus
  templateType: string
  createdAt: string
  signedAt: string | null
  client: { id: string; name: string; organization: string | null } | null
  project: { id: string; title: string; type: string } | null
  creator: { firstName: string; lastName: string } | null
}

function formatDate(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const PAGE_SIZE = 20

export function ContratsTable() {
  const [items, setItems] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Contrat | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchItems = useCallback(
    async (nextPage: number) => {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set("page", String(nextPage))
      params.set("limit", String(PAGE_SIZE))
      if (status) params.set("status", status)
      if (debounced) params.set("search", debounced)
      try {
        const r = await fetch(`/api/contrats?${params}`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          contrats: Contrat[]
          pages: number
        }
        setItems(data.contrats)
        setTotalPages(data.pages)
        setPage(nextPage)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [debounced, status]
  )

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  useEffect(() => {
    const handler = () => setFormOpen(true)
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get("projectId")) {
      setFormOpen(true)
    }
  }, [searchParams])

  const downloadPdf = async (c: Contrat) => {
    try {
      const r = await fetch(`/api/contrats/${c.id}/pdf`, { cache: "no-store" })
      if (!r.ok) throw new Error("Echec PDF")
      const blob = await r.blob()
      const ref = contratReference(c.id)
      const link = document.createElement("a")
      const href = URL.createObjectURL(blob)
      link.href = href
      link.download = `contrat-${ref}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF")
    }
  }

  const changeStatus = async (id: string, status: ContratStatus) => {
    setActionId(id)
    setError(null)
    try {
      const r = await fetch(`/api/contrats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec mise a jour")
      }
      await fetchItems(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  const deleteContrat = async (c: Contrat) => {
    setActionId(c.id)
    setError(null)
    try {
      const r = await fetch(`/api/contrats/${c.id}`, { method: "DELETE" })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec suppression")
      }
      setConfirmDelete(null)
      await fetchItems(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recherche
          </label>
          <Input
            placeholder="Client ou projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Statut
          </label>
          <Select
            value={status || "_all"}
            onValueChange={(v) => setStatus(v === "_all" ? "" : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous les statuts</SelectItem>
              {CONTRAT_STATUS_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {CONTRAT_STATUSES[k].label}
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
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucun contrat enregistre.
                  </p>
                  <Button
                    onClick={() => setFormOpen(true)}
                    className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                  >
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Creer le premier contrat
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => {
                const statusMeta = CONTRAT_STATUSES[c.status]
                const ref = contratReference(c.id)
                const busy = actionId === c.id
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-zinc-700">
                      <Link
                        href={`/admin/contrats/${c.id}`}
                        className="hover:text-[#C8151B]"
                      >
                        {ref}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {c.client?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {c.project?.title ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {TEMPLATE_TYPES[c.templateType as keyof typeof TEMPLATE_TYPES] ??
                        c.templateType}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusMeta?.color ?? "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {statusMeta?.label ?? c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPdf(c)}
                          disabled={busy}
                          title="Telecharger le PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Link href={`/admin/contrats/${c.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Voir le contrat"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {c.status === "a_envoyer" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => changeStatus(c.id, "envoye")}
                              disabled={busy}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              title="Marquer envoye"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDelete(c)}
                              disabled={busy}
                              title="Supprimer"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {c.status === "envoye" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => changeStatus(c.id, "signe")}
                              disabled={busy}
                              className="bg-green-600 text-white hover:bg-green-700"
                              title="Marquer signe"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeStatus(c.id, "refuse")}
                              disabled={busy}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              title="Marquer refuse"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Precedent
          </Button>
          <p className="text-zinc-600">
            Page {page} / {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems(page + 1)}
            disabled={page >= totalPages}
          >
            Suivant <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      <ContratForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => fetchItems(1)}
      />

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce contrat ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Seuls les contrats au statut A
              envoyer peuvent etre supprimes.
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <p className="text-sm text-zinc-700">
              Reference :{" "}
              <span className="font-mono font-semibold">
                {contratReference(confirmDelete.id)}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={actionId !== null}
            >
              Annuler
            </Button>
            <Button
              onClick={() => confirmDelete && deleteContrat(confirmDelete)}
              disabled={actionId !== null}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionId !== null ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
