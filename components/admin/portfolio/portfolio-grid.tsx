"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  PlusCircle,
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
  PortfolioItemForm,
  type PortfolioItemFormInitial,
} from "@/components/admin/portfolio/portfolio-item-form"
import {
  PORTFOLIO_TYPES,
  PORTFOLIO_TYPE_KEYS,
  youtubeThumbnail,
  type PortfolioType,
} from "@/lib/portfolio"
import { cn } from "@/lib/utils"

type Item = {
  id: string
  title: string
  type: PortfolioType
  date: string | null
  description: string | null
  mediaType: "photo" | "youtube"
  mediaUrl: string
  published: boolean
  displayOrder: number
}

export function PortfolioGridAdmin() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [typeFilter, setTypeFilter] = useState<"" | PortfolioType>("")
  const [publishedFilter, setPublishedFilter] = useState<
    "" | "true" | "false"
  >("")
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<
    PortfolioItemFormInitial | undefined
  >(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (typeFilter) params.set("type", typeFilter)
    if (publishedFilter) params.set("published", publishedFilter)
    try {
      const r = await fetch(`/api/portfolio?${params}`, { cache: "no-store" })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as Item[]
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, publishedFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const handler = () => {
      setFormInitial({ displayOrder: items.length + 1 })
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [items.length])

  const filtered = debounced
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(debounced.toLowerCase()) ||
          (i.description ?? "")
            .toLowerCase()
            .includes(debounced.toLowerCase())
      )
    : items

  const togglePublished = async (item: Item) => {
    setBusy(item.id)
    try {
      const r = await fetch(`/api/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      })
      if (!r.ok) {
        setError("Mise a jour impossible.")
      } else {
        fetchItems()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(null)
    }
  }

  const moveOrder = async (item: Item, direction: "up" | "down") => {
    const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder)
    const index = sorted.findIndex((i) => i.id === item.id)
    if (index === -1) return
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const other = sorted[swapIndex]
    setBusy(item.id)
    try {
      await Promise.all([
        fetch(`/api/portfolio/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: other.displayOrder }),
        }),
        fetch(`/api/portfolio/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: item.displayOrder }),
        }),
      ])
      fetchItems()
    } catch {
      setError("Reordonnancement impossible.")
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/portfolio/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        setError("Suppression impossible.")
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Recherche
            </label>
            <Input
              placeholder="Titre, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <Select
              value={typeFilter || "_all"}
              onValueChange={(v) =>
                setTypeFilter(v === "_all" ? "" : (v as PortfolioType))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous</SelectItem>
                {PORTFOLIO_TYPE_KEYS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PORTFOLIO_TYPES[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Publication
            </label>
            <Select
              value={publishedFilter || "_all"}
              onValueChange={(v) =>
                setPublishedFilter(v === "_all" ? "" : (v as "true" | "false"))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tout</SelectItem>
                <SelectItem value="true">Publie</SelectItem>
                <SelectItem value="false">Non publie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={() => {
            setFormInitial({ displayOrder: items.length + 1 })
            setFormOpen(true)
          }}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter une realisation
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="text-sm text-zinc-600">Aucune realisation.</p>
          <Button
            onClick={() => {
              setFormInitial({ displayOrder: items.length + 1 })
              setFormOpen(true)
            }}
            className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            Ajouter la premiere realisation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const thumb =
              item.mediaType === "youtube"
                ? youtubeThumbnail(item.mediaUrl)
                : item.mediaUrl
            const typeMeta = PORTFOLIO_TYPES[item.type]
            return (
              <article
                key={item.id}
                className={cn(
                  "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
                  !item.published && "opacity-70"
                )}
              >
                <div className="relative aspect-video bg-zinc-200">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (img.src.includes("maxresdefault")) {
                          img.src = img.src.replace(
                            "maxresdefault",
                            "hqdefault"
                          )
                        } else {
                          img.style.display = "none"
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute left-3 top-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      typeMeta.color
                    )}
                  >
                    {typeMeta.label}
                  </span>
                  <span
                    className={cn(
                      "absolute right-3 top-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      item.published
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-700 text-white"
                    )}
                  >
                    {item.published ? "Publie" : "Non publie"}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {item.title}
                    </h3>
                    <span className="shrink-0 text-[10px] text-zinc-400">
                      Ordre {item.displayOrder}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-zinc-600">{item.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 border-t border-zinc-100 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Monter"
                      onClick={() => moveOrder(item, "up")}
                      disabled={busy === item.id}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Descendre"
                      onClick={() => moveOrder(item, "down")}
                      disabled={busy === item.id}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(item)}
                      disabled={busy === item.id}
                      className={
                        item.published
                          ? "text-zinc-600"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }
                    >
                      {item.published ? (
                        <>
                          <EyeOff className="mr-1 h-4 w-4" /> Depublier
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-4 w-4" /> Publier
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Modifier"
                      onClick={() => {
                        setFormInitial({
                          id: item.id,
                          title: item.title,
                          type: item.type,
                          date: item.date,
                          description: item.description,
                          mediaType: item.mediaType,
                          mediaUrl: item.mediaUrl,
                          published: item.published,
                          displayOrder: item.displayOrder,
                        })
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Supprimer"
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <PortfolioItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={fetchItems}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette realisation ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive et masque immediatement la
              realisation du site public.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.title}</span>
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
