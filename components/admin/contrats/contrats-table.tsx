"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  PlusCircle,
  Send,
  Trash2,
  X,
  XCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  client: {
    id: string
    name: string
    organization: string | null
    email?: string | null
  } | null
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

type Stats = {
  total: number
  a_envoyer: number
  envoye: number
  signe: number
  refuse_annule: number
}

export function ContratsTable() {
  const [items, setItems] = useState<Contrat[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    a_envoyer: 0,
    envoye: 0,
    signe: 0,
    refuse_annule: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
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

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`/api/contrats?limit=1`, { cache: "no-store" })
      if (!r.ok) return
      // Fetch counts par statut en parallele
      const counts = await Promise.all(
        CONTRAT_STATUS_KEYS.map(async (k) => {
          const sr = await fetch(`/api/contrats?status=${k}&limit=1`, {
            cache: "no-store",
          })
          if (!sr.ok) return { key: k, count: 0 }
          const data = (await sr.json()) as { total: number }
          return { key: k, count: data.total ?? 0 }
        })
      )
      const map = new Map(counts.map((c) => [c.key, c.count]))
      const total = counts.reduce((s, c) => s + c.count, 0)
      setStats({
        total,
        a_envoyer: map.get("a_envoyer") ?? 0,
        envoye: map.get("envoye") ?? 0,
        signe: map.get("signe") ?? 0,
        refuse_annule:
          (map.get("refuse") ?? 0) + (map.get("annule") ?? 0),
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  useEffect(() => {
    fetchStats()
  }, [fetchStats, items.length])

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

  const envoyerParEmail = async (c: Contrat) => {
    setActionId(c.id)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(`/api/contrats/${c.id}/envoyer`, {
        method: "POST",
      })
      const data = (await r.json().catch(() => null)) as {
        emailSent?: boolean
        hadEmail?: boolean
        error?: string
      } | null
      if (!r.ok) throw new Error(data?.error || "Echec de l'envoi")
      if (data?.emailSent) {
        setInfo(`Contrat envoye par email a ${c.client?.email ?? "client"}.`)
      } else if (data?.hadEmail) {
        setInfo(
          `Statut passe a Envoye. L'email n'a pas pu etre delivre (Resend indisponible).`
        )
      } else {
        setInfo(
          "Statut passe a Envoye. Le client n'a pas d'adresse email enregistree."
        )
      }
      await fetchItems(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  const changeStatus = async (id: string, target: ContratStatus) => {
    setActionId(id)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(`/api/contrats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
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

  const chips = useMemo(
    () => [
      {
        label: "Total",
        value: stats.total,
        className: "bg-zinc-100 text-zinc-700 border-zinc-200",
      },
      {
        label: "A envoyer",
        value: stats.a_envoyer,
        className: "bg-zinc-100 text-zinc-700 border-zinc-300",
      },
      {
        label: "Envoyes",
        value: stats.envoye,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        label: "Signes",
        value: stats.signe,
        className: "bg-green-50 text-green-700 border-green-200",
      },
      {
        label: "Refuses / Annules",
        value: stats.refuse_annule,
        className: "bg-red-50 text-red-700 border-red-200",
      },
    ],
    [stats]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              chip.className
            )}
          >
            <span className="uppercase tracking-wider">{chip.label}</span>
            <span className="text-sm font-bold">{chip.value}</span>
          </div>
        ))}
      </div>

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
      {info && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
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
                const templateLabel =
                  TEMPLATE_TYPES[c.templateType as keyof typeof TEMPLATE_TYPES] ??
                  c.templateType
                const hasEmail = Boolean(c.client?.email)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/contrats/${c.id}`}
                          className="font-mono text-xs font-semibold text-zinc-900 hover:text-[#C8151B]"
                        >
                          {ref}
                        </Link>
                        <span className="inline-flex w-fit rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                          {templateLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {c.client?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {c.project?.title ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusMeta?.color ?? "bg-zinc-100 text-zinc-600"
                          )}
                        >
                          {statusMeta?.label ?? c.status}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {c.status === "signe" && c.signedAt
                            ? `Signe le ${formatDate(c.signedAt)}`
                            : `Cree le ${formatDate(c.createdAt)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/contrats/${c.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir le contrat
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => downloadPdf(c)}>
                              <Download className="mr-2 h-4 w-4" />
                              Telecharger PDF
                            </DropdownMenuItem>
                            {c.status === "a_envoyer" && hasEmail && (
                              <DropdownMenuItem
                                onSelect={() => envoyerParEmail(c)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Envoyer par email
                              </DropdownMenuItem>
                            )}
                            {c.status === "a_envoyer" && !hasEmail && (
                              <DropdownMenuItem
                                onSelect={() => changeStatus(c.id, "envoye")}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Marquer envoye
                              </DropdownMenuItem>
                            )}
                            {c.status === "envoye" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => changeStatus(c.id, "signe")}
                                >
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Marquer signe
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => changeStatus(c.id, "refuse")}
                                >
                                  <X className="mr-2 h-4 w-4 text-red-600" />
                                  Marquer refuse
                                </DropdownMenuItem>
                              </>
                            )}
                            {(c.status === "a_envoyer" ||
                              c.status === "envoye" ||
                              c.status === "refuse") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => changeStatus(c.id, "annule")}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-zinc-600" />
                                  Annuler le contrat
                                </DropdownMenuItem>
                              </>
                            )}
                            {c.status === "a_envoyer" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => setConfirmDelete(c)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
