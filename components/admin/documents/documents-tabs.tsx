"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileMinus,
  FileText,
  Pencil,
  RefreshCw,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DocumentForm,
  type DocumentFormInitial,
  type DocumentKind,
} from "@/components/admin/documents/document-form"
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_KEYS,
  INVOICE_TYPES,
  INVOICE_TYPE_KEYS,
  QUOTE_STATUSES,
  QUOTE_STATUS_KEYS,
  formatAmount,
  formatDate,
  type InvoiceStatus,
  type InvoiceType,
  type QuoteStatus,
} from "@/lib/documents"
import { cn } from "@/lib/utils"

type QuoteRow = {
  id: string
  reference: string
  subject: string
  status: QuoteStatus
  totalTtc: number
  validUntil: string | null
  client: { id: string; name: string; organization: string | null }
  project: { id: string; title: string } | null
  _count: { invoices: number }
}

type InvoiceRow = {
  id: string
  reference: string
  type: InvoiceType
  status: InvoiceStatus
  totalTtc: number
  dueAt: string | null
  client: { id: string; name: string; organization: string | null }
  project: { id: string; title: string } | null
}

const PAGE_SIZE = 10

export function DocumentsTabs() {
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get("projectId") ?? undefined

  const [tab, setTab] = useState<DocumentKind>("devis")
  const [formOpen, setFormOpen] = useState(false)
  const [formKind, setFormKind] = useState<DocumentKind>("devis")
  const [formInitial, setFormInitial] = useState<
    DocumentFormInitial | undefined
  >(undefined)

  useEffect(() => {
    const handler = () => {
      setFormKind(tab)
      setFormInitial(undefined)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [tab])

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as DocumentKind)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="devis">Devis</TabsTrigger>
            <TabsTrigger value="factures">Factures</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setFormKind(tab)
              setFormInitial(undefined)
              setFormOpen(true)
            }}
            className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            size="sm"
          >
            {tab === "devis" ? "Nouveau devis" : "Nouvelle facture"}
          </Button>
        </div>

        <TabsContent value="devis" className="mt-4">
          <QuotesPanel
            onCreate={() => {
              setFormKind("devis")
              setFormInitial(undefined)
              setFormOpen(true)
            }}
            onEdit={(quote) => {
              setFormKind("devis")
              setFormInitial({
                id: quote.id,
                clientId: quote.client.id,
                projectId: quote.project?.id ?? null,
                subject: quote.subject,
                status: quote.status,
              })
              setFormOpen(true)
            }}
            refreshKey={formOpen ? 0 : 1}
          />
        </TabsContent>

        <TabsContent value="factures" className="mt-4">
          <InvoicesPanel
            onCreate={() => {
              setFormKind("facture")
              setFormInitial(undefined)
              setFormOpen(true)
            }}
            refreshKey={formOpen ? 0 : 1}
          />
        </TabsContent>
      </Tabs>

      <DocumentForm
        kind={formKind}
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        defaultProjectId={projectIdParam}
        onSaved={() => {
          /* refresh handled by refreshKey toggle */
        }}
      />
    </div>
  )
}

function QuotesPanel({
  onCreate,
  onEdit,
  refreshKey,
}: {
  onCreate: () => void
  onEdit: (quote: QuoteRow) => void
  refreshKey: number
}) {
  const [items, setItems] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | QuoteStatus>("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuoteRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debounced, statusFilter])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (debounced) params.set("search", debounced)
    if (statusFilter) params.set("status", statusFilter)
    try {
      const r = await fetch(`/api/devis?${params}`, { cache: "no-store" })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as QuoteRow[]
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debounced, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems, refreshKey])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/devis/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
      } else {
        setDeleteTarget(null)
        fetchItems()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const handleConvert = async (id: string) => {
    setConverting(id)
    setError(null)
    try {
      const r = await fetch(`/api/devis/${id}/convertir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "standard" }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Conversion impossible."
        )
      } else {
        fetchItems()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setConverting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="quotes-search"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Recherche
          </label>
          <Input
            id="quotes-search"
            placeholder="Reference, objet, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="quotes-status"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Statut
          </label>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(v) =>
              setStatusFilter(v === "_all" ? "" : (v as QuoteStatus))
            }
          >
            <SelectTrigger id="quotes-status" className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {QUOTE_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {QUOTE_STATUSES[s].label}
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
              <TableHead>Objet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Validite</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucun devis pour le moment.
                  </p>
                  <Button
                    onClick={onCreate}
                    className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                  >
                    Creer le premier devis
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link
                      href={`/admin/devis-factures/${q.id}?kind=devis`}
                      className="font-medium text-zinc-900 hover:text-[#C8151B]"
                    >
                      {q.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {q.client.name}
                    {q.client.organization && (
                      <span className="block text-xs text-zinc-500">
                        {q.client.organization}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {q.project ? q.project.title : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {q.subject}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        QUOTE_STATUSES[q.status].color
                      )}
                    >
                      {QUOTE_STATUSES[q.status].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-zinc-900">
                    {formatAmount(q.totalTtc)}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {formatDate(q.validUntil)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/admin/devis-factures/${q.id}?kind=devis`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {q.status === "brouillon" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(q)}
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {q.status === "accepte" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConvert(q.id)}
                          disabled={converting === q.id}
                          aria-label="Convertir en facture"
                          className="text-emerald-700 hover:bg-emerald-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {q.status === "brouillon" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(q)}
                          aria-label="Supprimer"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && items.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={items.length}
          label="devis"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce devis ?</DialogTitle>
            <DialogDescription>
              Seuls les devis brouillon peuvent etre supprimes. Cette action
              est definitive.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.reference}</span>
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

function InvoicesPanel({
  onCreate,
  refreshKey,
}: {
  onCreate: () => void
  refreshKey: number
}) {
  const [items, setItems] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | InvoiceStatus>("")
  const [typeFilter, setTypeFilter] = useState<"" | InvoiceType>("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debounced, statusFilter, typeFilter])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (debounced) params.set("search", debounced)
    if (statusFilter) params.set("status", statusFilter)
    if (typeFilter) params.set("type", typeFilter)
    try {
      const r = await fetch(`/api/factures?${params}`, { cache: "no-store" })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as InvoiceRow[]
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debounced, statusFilter, typeFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems, refreshKey])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  )

  const markPaid = async (id: string) => {
    setUpdating(id)
    setError(null)
    try {
      const r = await fetch(`/api/factures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "payee" }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Mise a jour impossible."
        )
      } else {
        fetchItems()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setUpdating(null)
    }
  }

  const createAvoir = async (id: string) => {
    setUpdating(id)
    setError(null)
    try {
      const r = await fetch(`/api/factures/${id}/avoir`, { method: "POST" })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Creation d'avoir impossible."
        )
      } else {
        fetchItems()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="invoices-search"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Recherche
          </label>
          <Input
            id="invoices-search"
            placeholder="Reference, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Statut
          </label>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(v) =>
              setStatusFilter(v === "_all" ? "" : (v as InvoiceStatus))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {INVOICE_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {INVOICE_STATUSES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Type
          </label>
          <Select
            value={typeFilter || "_all"}
            onValueChange={(v) =>
              setTypeFilter(v === "_all" ? "" : (v as InvoiceType))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {INVOICE_TYPE_KEYS.map((t) => (
                <SelectItem key={t} value={t}>
                  {INVOICE_TYPES[t]}
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
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Echeance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucune facture pour le moment.
                  </p>
                  <Button
                    onClick={onCreate}
                    className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                  >
                    Creer la premiere facture
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link
                      href={`/admin/devis-factures/${f.id}?kind=facture`}
                      className="font-medium text-zinc-900 hover:text-[#C8151B]"
                    >
                      {f.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {f.client.name}
                    {f.client.organization && (
                      <span className="block text-xs text-zinc-500">
                        {f.client.organization}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {f.project ? f.project.title : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {INVOICE_TYPES[f.type]}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        INVOICE_STATUSES[f.status].color
                      )}
                    >
                      {INVOICE_STATUSES[f.status].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-zinc-900">
                    {formatAmount(f.totalTtc)}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {formatDate(f.dueAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/admin/devis-factures/${f.id}?kind=facture`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {f.status === "emise" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markPaid(f.id)}
                          disabled={updating === f.id}
                          aria-label="Marquer comme payee"
                          className="text-emerald-700 hover:bg-emerald-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {f.type !== "avoir" && f.status !== "annulee" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => createAvoir(f.id)}
                          disabled={updating === f.id}
                          aria-label="Creer un avoir"
                          className="text-amber-700 hover:bg-amber-50"
                        >
                          <FileMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && items.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={items.length}
          label="facture"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  total,
  label,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  label: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between text-sm text-zinc-600">
      <p>
        Page {page} sur {totalPages} - {total} {label}
        {total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Precedent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages}
        >
          Suivant <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
