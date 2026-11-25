"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImageIcon, Loader2, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SortableList } from "@/components/admin/ui/sortable-list"
import { cn } from "@/lib/utils"
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_KEYS, type GalleryCategory } from "@/lib/gallery"

type AlbumRow = {
  id: string
  slug: string
  title: string
  category: string
  date: string | null
  published: boolean
  photoCount: number
  coverUrl: string | null
  programName: string | null
}

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dakar" })

// Liste des albums de la galerie : ordre par glisser-déposer ou flèches
export function AlbumsList() {
  const router = useRouter()
  const [albums, setAlbums] = useState<AlbumRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/galerie/albums", { cache: "no-store" })
      if (!response.ok) throw new Error()
      setAlbums(await response.json())
    } catch {
      setError("Chargement des albums impossible. Rechargez la page.")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const move = async (from: number, to: number) => {
    if (!albums) return
    const next = [...albums]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setAlbums(next)
    const response = await fetch("/api/galerie/albums/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((a) => a.id) }),
    }).catch(() => null)
    if (!response?.ok) {
      setError("Nouvel ordre non enregistré. Réessayez.")
      void load()
    } else setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          L&apos;ordre sert à départager les albums de même date sur le site (les plus récents d&apos;abord).
        </p>
        <Button type="button" onClick={() => setCreating(true)} className="bg-[#C8151B] text-white hover:bg-[#a51217]">
          <PlusCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Nouvel album
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {albums === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
          <p className="mt-3 font-medium text-zinc-900">Aucun album pour le moment</p>
          <p className="mt-1 text-sm text-zinc-500">Créez un album, ajoutez vos photos puis publiez-le.</p>
        </div>
      ) : (
        <SortableList
          items={albums}
          getKey={(a) => a.id}
          onMove={move}
          label="Albums de la galerie"
          itemLabel="l'album"
          renderItem={(a) => (
            <Link href={`/admin/galerie/${a.id}`} draggable={false} className="flex min-h-[64px] flex-1 items-center gap-4 rounded-md">
              <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                {a.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt="" draggable={false} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-zinc-400" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-zinc-900">{a.title}</span>
                <span className="block text-xs text-zinc-500">
                  {GALLERY_CATEGORIES[a.category as GalleryCategory] ?? a.category}
                  {a.date ? ` · ${DATE.format(new Date(a.date))}` : ""} · {a.photoCount} photo{a.photoCount > 1 ? "s" : ""}
                  {a.programName ? ` · ${a.programName}` : ""}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  a.published ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {a.published ? "Publié" : "Brouillon"}
              </span>
            </Link>
          )}
        />
      )}

      <NewAlbumDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => router.push(`/admin/galerie/${id}`)}
      />
    </div>
  )
}

function NewAlbumDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<GalleryCategory>("evenements")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Titre requis")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/galerie/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError((data && typeof data.error === "string" && data.error) || "Création impossible.")
        return
      }
      onCreated(data.id)
    } catch {
      setError("Connexion impossible. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Nouvel album</DialogTitle>
            <DialogDescription>L&apos;album reste en brouillon tant qu&apos;il n&apos;est pas publié.</DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-album-title">
                Titre <span className="text-[#C8151B]">*</span>
              </Label>
              <Input
                id="new-album-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "new-album-error" : undefined}
              />
              {error && (
                <p id="new-album-error" className="text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium text-zinc-900">Catégorie</legend>
              <div className="flex flex-wrap gap-2">
                {GALLERY_CATEGORY_KEYS.map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm",
                      category === key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700"
                    )}
                  >
                    <input
                      type="radio"
                      name="new-album-category"
                      value={key}
                      checked={category === key}
                      onChange={() => setCategory(key)}
                      className="sr-only"
                    />
                    {GALLERY_CATEGORIES[key]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a51217]">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Créer l&apos;album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
