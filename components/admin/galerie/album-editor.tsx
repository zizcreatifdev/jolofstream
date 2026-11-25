"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_KEYS,
  MAX_PHOTOS_PER_ALBUM,
  gallerySlugify,
  photoAlt,
  type GalleryCategory,
} from "@/lib/gallery"
import { GalleryUploader, type UploadedPhoto } from "@/components/admin/galerie/gallery-uploader"

type Photo = UploadedPhoto
type Album = {
  id: string
  slug: string
  title: string
  description: string | null
  date: string | null
  category: string
  programId: string | null
  coverPhotoId: string | null
  published: boolean
  photos: Photo[]
}
type Form = { title: string; slug: string; description: string; date: string; category: GalleryCategory; programId: string }
type FieldErrors = Partial<Record<keyof Form | "published", string>>

function toForm(a: Album): Form {
  return {
    title: a.title,
    slug: a.slug,
    description: a.description ?? "",
    date: a.date ? a.date.slice(0, 10) : "",
    category: (GALLERY_CATEGORY_KEYS as string[]).includes(a.category) ? (a.category as GalleryCategory) : "evenements",
    programId: a.programId ?? "",
  }
}

function firstErrors(issues: Record<string, string[]> | undefined): FieldErrors {
  const out: FieldErrors = {}
  for (const [k, v] of Object.entries(issues ?? {})) if (v?.[0]) out[k as keyof FieldErrors] = v[0]
  return out
}

export function AlbumEditor({ albumId, programs }: { albumId: string; programs: Array<{ id: string; name: string }> }) {
  const router = useRouter()
  const [album, setAlbum] = useState<Album | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [slugTouched, setSlugTouched] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Photo | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: "photos"; ids: string[] } | { kind: "album" }>(null)
  const [busy, setBusy] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const albumRef = useRef<Album | null>(null)
  albumRef.current = album

  const load = useCallback(async () => {
    const response = await fetch(`/api/galerie/albums/${albumId}`, { cache: "no-store" })
    if (!response.ok) {
      setStatus({ tone: "error", text: "Album introuvable." })
      return
    }
    const data = (await response.json()) as Album
    setAlbum(data)
    setForm(toForm(data))
  }, [albumId])

  useEffect(() => {
    void load()
  }, [load])

  const flash = (tone: "ok" | "error", text: string) => setStatus({ tone, text })

  const patch = async (body: Record<string, unknown>, ok: string): Promise<boolean> => {
    const response = await fetch(`/api/galerie/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null)
    const data = await response?.json().catch(() => null)
    if (!response?.ok) {
      setErrors(firstErrors(data?.issues))
      flash("error", (data && typeof data.error === "string" && data.error) || "Enregistrement impossible.")
      return false
    }
    setAlbum((a) => (a ? { ...a, ...data, photos: a.photos } : a))
    setErrors({})
    flash("ok", ok)
    return true
  }

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    await patch(
      {
        title: form.title,
        slug: form.slug,
        description: form.description,
        date: form.date,
        category: form.category,
        programId: form.programId,
      },
      "Album enregistré."
    )
    setSaving(false)
  }

  const reorder = async (photos: Photo[]) => {
    setAlbum((a) => (a ? { ...a, photos } : a))
    const response = await fetch(`/api/galerie/albums/${albumId}/photos/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: photos.map((p) => p.id) }),
    }).catch(() => null)
    if (!response?.ok) {
      flash("error", "Nouvel ordre non enregistré. Réessayez.")
      void load()
    }
  }

  const move = (from: number, to: number) => {
    if (!album || to < 0 || to >= album.photos.length || from === to) return
    const next = [...album.photos]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    void reorder(next)
  }

  const onUploaded = useCallback((photo: Photo) => {
    setAlbum((a) => (a ? { ...a, photos: [...a.photos, photo] } : a))
  }, [])

  // Fin d'une série : nouvelles photos remises dans l'ordre de sélection
  const onBatchDone = (ids: string[]) => {
    const a = albumRef.current
    if (!a) return
    const byId = new Map(a.photos.map((p) => [p.id, p]))
    const fresh = ids.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p))
    const next = [...a.photos.filter((p) => !ids.includes(p.id)), ...fresh]
    if (next.map((p) => p.id).join() !== a.photos.map((p) => p.id).join()) void reorder(next)
  }

  const deletePhotos = async (ids: string[]) => {
    setBusy(true)
    const response = await fetch(`/api/galerie/albums/${albumId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => null)
    const data = await response?.json().catch(() => null)
    setBusy(false)
    setConfirm(null)
    if (!response?.ok) {
      flash("error", (data && typeof data.error === "string" && data.error) || "Suppression impossible.")
      return
    }
    setSelected(new Set())
    setAlbum((a) =>
      a
        ? {
            ...a,
            photos: a.photos.filter((p) => !ids.includes(p.id)),
            coverPhotoId: a.coverPhotoId && ids.includes(a.coverPhotoId) ? null : a.coverPhotoId,
            published: data.published,
          }
        : a
    )
    flash(
      "ok",
      `${data.deleted} photo${data.deleted > 1 ? "s" : ""} supprimée${data.deleted > 1 ? "s" : ""}.${data.remaining === 0 && album?.published ? " L'album est repassé en brouillon." : ""}`
    )
  }

  const deleteAlbum = async () => {
    setBusy(true)
    const response = await fetch(`/api/galerie/albums/${albumId}`, { method: "DELETE" }).catch(() => null)
    setBusy(false)
    if (!response?.ok) {
      setConfirm(null)
      flash("error", "Suppression de l'album impossible.")
      return
    }
    router.push("/admin/galerie")
    router.refresh()
  }

  if (!album || !form) {
    return status ? (
      <p className="text-sm text-red-600">{status.text}</p>
    ) : (
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const coverId = album.coverPhotoId ?? album.photos[0]?.id ?? null
  const allSelected = album.photos.length > 0 && selected.size === album.photos.length
  const field = (key: keyof Form) => ({
    id: `album-${key}`,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `album-${key}-erreur` : undefined,
  })
  const err = (key: keyof Form) =>
    errors[key] ? (
      <p id={`album-${key}-erreur`} className="text-xs text-red-600">
        {errors[key]}
      </p>
    ) : null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/galerie" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tous les albums
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {album.published && (
            <a
              href={`/galerie/${album.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Voir sur le site <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3">
            <Switch
              id="album-published"
              checked={album.published}
              onCheckedChange={(checked) =>
                void patch({ published: checked }, checked ? "Album publié." : "Album repassé en brouillon.")
              }
              aria-describedby="album-published-aide"
            />
            <Label htmlFor="album-published">{album.published ? "Publié" : "Brouillon"}</Label>
          </div>
        </div>
      </div>
      <p id="album-published-aide" className="-mt-6 text-xs text-zinc-500">
        Publication possible avec au moins une photo.
      </p>
      <h1 className="text-2xl font-bold text-zinc-900">{album.title}</h1>

      {status && (
        <p role={status.tone === "error" ? "alert" : "status"} className={cn("text-sm", status.tone === "error" ? "text-red-600" : "text-emerald-700")}>
          {status.text}
        </p>
      )}

      <form onSubmit={saveInfo} noValidate className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Informations</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="album-title">
              Titre <span className="text-[#C8151B]">*</span>
            </Label>
            <Input
              {...field("title")}
              value={form.title}
              maxLength={120}
              onChange={(e) => {
                const title = e.target.value
                setForm((f) => (f ? { ...f, title, slug: slugTouched ? f.slug : gallerySlugify(title) } : f))
              }}
            />
            {err("title")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-slug">Adresse (slug)</Label>
            <Input
              {...field("slug")}
              value={form.slug}
              maxLength={80}
              onChange={(e) => {
                setSlugTouched(true)
                setForm((f) => (f ? { ...f, slug: e.target.value } : f))
              }}
            />
            <p className="text-xs text-zinc-500">
              jolofstream.com/galerie/{form.slug || "…"}
              <button
                type="button"
                className="ml-2 inline-flex min-h-[44px] items-center font-medium text-zinc-700 underline underline-offset-2"
                onClick={() => {
                  setSlugTouched(false)
                  setForm((f) => (f ? { ...f, slug: gallerySlugify(f.title) } : f))
                }}
              >
                Générer depuis le titre
              </button>
            </p>
            {err("slug")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-date">Date</Label>
            <Input {...field("date")} type="date" value={form.date} onChange={(e) => setForm((f) => (f ? { ...f, date: e.target.value } : f))} />
            {err("date")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-programId">Formation liée (facultative)</Label>
            <select
              {...field("programId")}
              value={form.programId}
              onChange={(e) => setForm((f) => (f ? { ...f, programId: e.target.value } : f))}
              className="flex h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
            >
              <option value="">Aucune</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">Les miniatures de l&apos;album s&apos;affichent sous le programme, page Formations.</p>
            {err("programId")}
          </div>
        </div>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-zinc-900">Catégorie</legend>
          <div className="flex flex-wrap gap-2">
            {GALLERY_CATEGORY_KEYS.map((key) => (
              <label
                key={key}
                className={cn(
                  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm",
                  form.category === key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700"
                )}
              >
                <input
                  type="radio"
                  name="album-category"
                  value={key}
                  checked={form.category === key}
                  onChange={() => setForm((f) => (f ? { ...f, category: key } : f))}
                  className="sr-only"
                />
                {GALLERY_CATEGORIES[key]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="album-description">Description</Label>
          <Textarea
            {...field("description")}
            rows={3}
            maxLength={600}
            value={form.description}
            onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
          />
          <p className="text-xs text-zinc-500">{form.description.length} / 600</p>
          {err("description")}
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setConfirm({ kind: "album" })} className="border-red-200 text-red-700 hover:bg-red-50">
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Supprimer l&apos;album
          </Button>
          <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a51217]">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </div>
      </form>

      <section className="space-y-4" aria-labelledby="album-photos-titre">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="album-photos-titre" className="text-base font-semibold text-zinc-900">
            Photos ({album.photos.length} / {MAX_PHOTOS_PER_ALBUM})
          </h2>
          {album.photos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => setSelected(e.target.checked ? new Set(album.photos.map((p) => p.id)) : new Set())}
                  className="h-4 w-4"
                />
                Tout sélectionner
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selected.size === 0}
                onClick={() => setConfirm({ kind: "photos", ids: Array.from(selected) })}
                className="min-h-[44px] border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Supprimer la sélection ({selected.size})
              </Button>
            </div>
          )}
        </div>

        <GalleryUploader albumId={album.id} existingCount={album.photos.length} onUploaded={onUploaded} onBatchDone={onBatchDone} />

        {album.photos.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            Aucune photo : ajoutez-en pour pouvoir publier l&apos;album.
          </p>
        ) : (
          <ol aria-label="Photos de l'album" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {album.photos.map((photo, i) => {
              const isCover = photo.id === coverId
              const checked = selected.has(photo.id)
              return (
                <li
                  key={photo.id}
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement).closest("input, button, textarea")) {
                      e.preventDefault()
                      return
                    }
                    setDragIndex(i)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onDragOver={(e) => {
                    if (dragIndex === null) return
                    e.preventDefault()
                    setOverIndex(i)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null && dragIndex !== i) move(dragIndex, i)
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                  data-photo-id={photo.id}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-white",
                    overIndex === i && dragIndex !== i ? "border-zinc-900" : checked ? "border-[#C8151B]" : "border-zinc-200",
                    dragIndex === i && "opacity-50"
                  )}
                >
                  <div className="relative aspect-[4/3] bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbUrl}
                      alt={photoAlt(album.title, photo.alt, i)}
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <label className="absolute left-1 top-1 flex h-11 w-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelected((s) => {
                            const next = new Set(s)
                            if (e.target.checked) next.add(photo.id)
                            else next.delete(photo.id)
                            return next
                          })
                        }
                        aria-label={`Sélectionner la photo ${i + 1}`}
                        className="h-5 w-5"
                      />
                    </label>
                    {isCover && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-900">
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        Couverture
                      </span>
                    )}
                    <GripVertical className="absolute bottom-2 right-2 h-5 w-5 cursor-grab rounded bg-white/90 text-zinc-500" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 p-2">
                    <p className="truncate text-xs text-zinc-600" title={photo.alt ?? undefined}>
                      <span className="font-semibold text-zinc-900">{i + 1}.</span> {photo.alt || <span className="italic">Texte alternatif par défaut</span>}
                    </p>
                    <div className="flex flex-wrap gap-0.5">
                      <IconButton label={`Avancer la photo ${i + 1}`} onClick={() => move(i, i - 1)} disabled={i === 0}>
                        <ArrowLeft className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Reculer la photo ${i + 1}`} onClick={() => move(i, i + 1)} disabled={i === album.photos.length - 1}>
                        <ArrowRight className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Définir la photo ${i + 1} comme couverture`}
                        onClick={() => void patch({ coverPhotoId: photo.id }, "Couverture définie.")}
                        disabled={isCover}
                      >
                        <Star className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Modifier le texte de la photo ${i + 1}`} onClick={() => setEditing(photo)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Supprimer la photo ${i + 1}`} onClick={() => setConfirm({ kind: "photos", ids: [photo.id] })} danger>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <PhotoTextDialog
        photo={editing}
        index={editing ? album.photos.findIndex((p) => p.id === editing.id) : 0}
        albumTitle={album.title}
        onClose={() => setEditing(null)}
        onSaved={(p) => {
          setAlbum((a) => (a ? { ...a, photos: a.photos.map((x) => (x.id === p.id ? { ...x, alt: p.alt, caption: p.caption } : x)) } : a))
          setEditing(null)
          flash("ok", "Texte de la photo enregistré.")
        }}
      />

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "album"
                ? "Supprimer cet album ?"
                : `Supprimer ${confirm?.ids.length ?? 0} photo${(confirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "album"
                ? `L'album « ${album.title} » et ses ${album.photos.length} photos seront supprimés, fichiers compris. Action définitive.`
                : "Les fichiers (grande taille et miniature) sont supprimés du stockage. Action définitive."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => (confirm?.kind === "album" ? void deleteAlbum() : confirm && void deletePhotos(confirm.ids))}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30",
        danger && "text-red-600 hover:bg-red-50"
      )}
    >
      {children}
    </button>
  )
}

function PhotoTextDialog({
  photo,
  index,
  albumTitle,
  onClose,
  onSaved,
}: {
  photo: Photo | null
  index: number
  albumTitle: string
  onClose: () => void
  onSaved: (photo: Photo) => void
}) {
  const [alt, setAlt] = useState("")
  const [caption, setCaption] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAlt(photo?.alt ?? "")
    setCaption(photo?.caption ?? "")
    setError(null)
  }, [photo])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo) return
    setSaving(true)
    const response = await fetch(`/api/galerie/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt, caption }),
    }).catch(() => null)
    const data = await response?.json().catch(() => null)
    setSaving(false)
    if (!response?.ok) {
      setError((data && typeof data.error === "string" && data.error) || "Enregistrement impossible.")
      return
    }
    onSaved(data)
  }

  return (
    <Dialog open={photo !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={save} noValidate>
          <DialogHeader>
            <DialogTitle>Photo {index + 1} : texte alternatif et légende</DialogTitle>
            <DialogDescription>Le texte alternatif décrit la photo pour les lecteurs d&apos;écran.</DialogDescription>
          </DialogHeader>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.thumbUrl} alt="" className="my-4 max-h-48 w-full rounded-md object-contain" />
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="photo-alt">Texte alternatif</Label>
              <Input id="photo-alt" value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} placeholder={photoAlt(albumTitle, null, index)} />
              <p className="text-xs text-zinc-500">Vide : « {photoAlt(albumTitle, null, index)} ».</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo-caption">Légende (affichée dans la visionneuse)</Label>
              <Input id="photo-caption" value={caption} maxLength={200} onChange={(e) => setCaption(e.target.value)} />
              <p className="text-xs text-zinc-500">{caption.length} / 200</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a51217]">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
