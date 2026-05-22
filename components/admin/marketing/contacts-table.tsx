"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BellOff,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  ContactForm,
  type ContactFormInitial,
} from "@/components/admin/marketing/contact-form"
import { ImportModal } from "@/components/admin/marketing/import-modal"
import { getListeColor, getListeLabel } from "@/lib/marketing"
import { cn } from "@/lib/utils"

type Contact = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  lists: string[]
  unsubscribed: boolean
  createdAt: string
  client: { id: string; name: string; organization: string | null } | null
  clientId: string | null
}

type Stats = { total: number; actifs: number; desabonnes: number }

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const PAGE_SIZE = 20

export function ContactsTable({
  selectedListe,
  onChanged,
}: {
  selectedListe: string | null
  onChanged: () => void
}) {
  const [items, setItems] = useState<Contact[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    actifs: 0,
    desabonnes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [showUnsub, setShowUnsub] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ContactFormInitial | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null)
  const [syncing, setSyncing] = useState(false)

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
      if (selectedListe) params.set("list", selectedListe)
      if (debounced) params.set("search", debounced)
      if (showUnsub) params.set("unsubscribed", "true")
      else params.set("unsubscribed", "false")
      try {
        const r = await fetch(`/api/marketing/contacts?${params}`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          contacts: Contact[]
          pages: number
          stats: Stats
        }
        setItems(data.contacts)
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
    [debounced, selectedListe, showUnsub]
  )

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  useEffect(() => {
    const handler = () => {
      setEditing(null)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const handleEdit = (c: Contact) => {
    setEditing({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      clientId: c.clientId,
      lists: c.lists ?? [],
    })
    setFormOpen(true)
  }

  const toggleUnsubscribe = async (c: Contact) => {
    setActionId(c.id)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(`/api/marketing/contacts/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribed: !c.unsubscribed }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec mise a jour")
      }
      setInfo(
        c.unsubscribed
          ? `${c.email} reabonne.`
          : `${c.email} desabonne.`
      )
      await fetchItems(page)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  const deleteContact = async (c: Contact) => {
    setActionId(c.id)
    setError(null)
    try {
      const r = await fetch(`/api/marketing/contacts/${c.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec suppression")
      }
      setConfirmDelete(null)
      await fetchItems(page)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setActionId(null)
    }
  }

  const exportCsv = async () => {
    try {
      const r = await fetch("/api/marketing/contacts/export", {
        cache: "no-store",
      })
      if (!r.ok) throw new Error("Echec export")
      const blob = await r.blob()
      const link = document.createElement("a")
      const href = URL.createObjectURL(blob)
      link.href = href
      link.download = `contacts-marketing-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur export")
    }
  }

  const syncCrm = async () => {
    setSyncing(true)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch("/api/marketing/sync", { method: "POST" })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec synchronisation")
      }
      const data = (await r.json()) as {
        synchronises: number
        deja_presents: number
      }
      setInfo(
        `${data.synchronises} nouveau${data.synchronises > 1 ? "x" : ""} contact${data.synchronises > 1 ? "s" : ""} synchronise${data.synchronises > 1 ? "s" : ""} depuis le CRM (${data.deja_presents} deja presents).`
      )
      await fetchItems(1)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Contacts total" value={stats.total} accent="zinc" />
        <StatCard label="Actifs" value={stats.actifs} accent="green" />
        <StatCard
          label="Desabonnes"
          value={stats.desabonnes}
          accent="red"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter un contact
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="mr-1.5 h-4 w-4" /> Importer CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Exporter CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={syncCrm}
          disabled={syncing}
        >
          <RefreshCw
            className={cn(
              "mr-1.5 h-4 w-4",
              syncing && "animate-spin"
            )}
          />
          {syncing ? "Sync..." : "Sync CRM"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recherche
          </label>
          <Input
            placeholder="Email, prenom ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showUnsub}
            onChange={(e) => setShowUnsub(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Afficher uniquement les desabonnes
        </label>
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
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Listes</TableHead>
              <TableHead>Client</TableHead>
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
                    Aucun contact pour ces filtres.
                  </p>
                  <Button
                    onClick={syncCrm}
                    variant="outline"
                    className="mt-4"
                    disabled={syncing}
                  >
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Synchroniser depuis le CRM
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => {
                const busy = actionId === c.id
                const fullName = [c.firstName, c.lastName]
                  .filter(Boolean)
                  .join(" ")
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-zinc-900">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {fullName || (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.lists?.length > 0 ? (
                          c.lists.map((l) => (
                            <span
                              key={l}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                getListeColor(l)
                              )}
                            >
                              {getListeLabel(l)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {c.client ? (
                        <Link
                          href={`/admin/clients/${c.client.id}`}
                          className="hover:text-[#C8151B]"
                        >
                          {c.client.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.unsubscribed ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Desabonne
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Actif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {formatDate(c.createdAt)}
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
                            <DropdownMenuItem onSelect={() => handleEdit(c)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toggleUnsubscribe(c)}
                            >
                              {c.unsubscribed ? (
                                <>
                                  <BellRing className="mr-2 h-4 w-4 text-emerald-600" />
                                  Reabonner
                                </>
                              ) : (
                                <>
                                  <BellOff className="mr-2 h-4 w-4 text-zinc-600" />
                                  Desabonner
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setConfirmDelete(c)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
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

      <ContactForm
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v)
          if (!v) setEditing(null)
        }}
        onSaved={() => {
          fetchItems(page)
          onChanged()
        }}
        initial={editing}
      />

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          fetchItems(1)
          onChanged()
        }}
      />

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce contact ?</DialogTitle>
            <DialogDescription>
              Le contact sera definitivement supprime de la liste marketing.
              Le client CRM associe n&apos;est pas affecte.
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <p className="text-sm text-zinc-700">{confirmDelete.email}</p>
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
              onClick={() => confirmDelete && deleteContact(confirmDelete)}
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
  accent: "zinc" | "green" | "red"
}) {
  const colors = {
    zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
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
