"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Send,
  Trash2,
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
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_KEYS,
  type CampaignStatus,
} from "@/lib/campaign-templates"
import { getListeColor, getListeLabel } from "@/lib/marketing"
import { cn } from "@/lib/utils"

type Campagne = {
  id: string
  title: string
  subject: string
  body: string
  lists: string[]
  status: CampaignStatus
  templateType: string | null
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  creator: { firstName: string; lastName: string } | null
}

type Stats = {
  total: number
  brouillons: number
  planifies: number
  envoyes: number
}

const PAGE_SIZE = 10

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

export function CampagnesList() {
  const [items, setItems] = useState<Campagne[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    brouillons: 0,
    planifies: 0,
    envoyes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Campagne | null>(null)

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
        const r = await fetch(`/api/marketing/campagnes?${params}`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          campagnes: Campagne[]
          pages: number
          stats: Stats
        }
        setItems(data.campagnes)
        setTotalPages(data.pages)
        setStats(data.stats)
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

  const duplicateCampagne = async (c: Campagne) => {
    setActionId(c.id)
    setError(null)
    try {
      const r = await fetch("/api/marketing/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${c.title} (copie)`,
          subject: c.subject,
          body: c.body,
          lists: c.lists,
          templateType: c.templateType ?? "",
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec duplication")
      }
      await fetchItems(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  const deleteCampagne = async (c: Campagne) => {
    setActionId(c.id)
    setError(null)
    try {
      const r = await fetch(`/api/marketing/campagnes/${c.id}`, {
        method: "DELETE",
      })
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} accent="zinc" />
        <StatCard
          label="Brouillons"
          value={stats.brouillons}
          accent="zinc"
        />
        <StatCard label="Planifies" value={stats.planifies} accent="blue" />
        <StatCard label="Envoyes" value={stats.envoyes} accent="green" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-72">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Recherche
            </label>
            <Input
              placeholder="Titre ou objet..."
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
                {CAMPAIGN_STATUS_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {CAMPAIGN_STATUSES[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Link href="/admin/mail-marketing/campagnes/nouvelle">
          <Button className="bg-[#C8151B] text-white hover:bg-[#a01015]">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Nouvelle campagne
          </Button>
        </Link>
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
              <TableHead>Titre</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Listes</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucune campagne pour le moment.
                  </p>
                  <Link
                    href="/admin/mail-marketing/campagnes/nouvelle"
                    className="mt-4 inline-block"
                  >
                    <Button className="bg-[#C8151B] text-white hover:bg-[#a01015]">
                      <PlusCircle className="mr-1.5 h-4 w-4" />
                      Creer la premiere campagne
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => {
                const statusMeta = CAMPAIGN_STATUSES[c.status]
                const busy = actionId === c.id
                const isDraft = c.status === "brouillon"
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-semibold text-zinc-900">
                      <Link
                        href={`/admin/mail-marketing/campagnes/${c.id}`}
                        className="hover:text-[#C8151B]"
                      >
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      <span className="line-clamp-1">{c.subject}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.lists.slice(0, 3).map((l) => (
                          <span
                            key={l}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              getListeColor(l)
                            )}
                          >
                            {getListeLabel(l)}
                          </span>
                        ))}
                        {c.lists.length > 3 && (
                          <span className="text-[10px] text-zinc-500">
                            +{c.lists.length - 3}
                          </span>
                        )}
                      </div>
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
                      {c.status === "envoye" && c.sentAt
                        ? `Envoye le ${formatDate(c.sentAt)}`
                        : c.status === "planifie" && c.scheduledAt
                          ? `Planifie le ${formatDate(c.scheduledAt)}`
                          : `Cree le ${formatDate(c.createdAt)}`}
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
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/mail-marketing/campagnes/${c.id}`}
                              >
                                {isDraft ? (
                                  <>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifier
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir
                                  </>
                                )}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => duplicateCampagne(c)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Dupliquer
                            </DropdownMenuItem>
                            {(isDraft || c.status === "planifie") && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/mail-marketing/campagnes/${c.id}?send=1`}
                                >
                                  <Send className="mr-2 h-4 w-4 text-emerald-600" />
                                  Envoyer
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isDraft && (
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

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette campagne ?</DialogTitle>
            <DialogDescription>
              Seules les campagnes au statut Brouillon peuvent etre
              supprimees. Cette action est definitive.
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <p className="text-sm text-zinc-700">{confirmDelete.title}</p>
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
              onClick={() => confirmDelete && deleteCampagne(confirmDelete)}
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: "zinc" | "blue" | "green"
}) {
  const colors = {
    zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
  } as const
  return (
    <div className={cn("rounded-xl border px-4 py-3", colors[accent])}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
