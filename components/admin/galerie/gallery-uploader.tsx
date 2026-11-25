"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_PHOTOS_PER_ALBUM, MAX_PHOTOS_PER_UPLOAD } from "@/lib/gallery"
import { extensionFor, isAcceptedImage, prepareGalleryPhoto } from "@/lib/image-resize"
import { putToSignedUrl, requestSignedUpload } from "@/lib/signed-upload-client"

export type UploadedPhoto = {
  id: string
  url: string
  thumbUrl: string
  width: number
  height: number
  alt: string | null
  caption: string | null
  order: number
}

type ItemStatus = "attente" | "traitement" | "envoi" | "enregistrement" | "termine" | "erreur"
type Item = { key: string; file: File; status: ItemStatus; progress: number; error: string | null; photoId: string | null }

const CONCURRENCY = 3
const STATUS_LABELS: Record<ItemStatus, string> = {
  attente: "En attente",
  traitement: "Redimensionnement",
  envoi: "Envoi",
  enregistrement: "Enregistrement",
  termine: "Terminé",
  erreur: "Échec",
}

// Envoi de photos vers un album : redimensionnement dans le navigateur
// (grande taille et miniature, sans EXIF), envoi direct par URL signée,
// 3 fichiers à la fois, progression par fichier, réessai d'un fichier en
// échec sans bloquer les autres.
export function GalleryUploader({
  albumId,
  existingCount,
  onUploaded,
  onBatchDone,
}: {
  albumId: string
  existingCount: number
  onUploaded: (photo: UploadedPhoto) => void
  onBatchDone: (photoIdsInSelectionOrder: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const running = useRef(0)
  const itemsRef = useRef<Item[]>([])
  itemsRef.current = items
  const batchKeys = useRef<string[]>([])

  const update = useCallback((key: string, patch: Partial<Item>) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }, [])

  const processItem = useCallback(
    async (item: Item) => {
      try {
        update(item.key, { status: "traitement", progress: 0.05, error: null })
        const { large, thumb } = await prepareGalleryPhoto(item.file)
        const base = item.file.name.replace(/\.[^.]+$/, "") || "photo"
        update(item.key, { status: "envoi", progress: 0.1 })
        const signedLarge = await requestSignedUpload({
          bucket: "galerie",
          kind: "photo",
          fileName: `${base}.${extensionFor(large.type)}`,
          contentType: large.type,
          size: large.blob.size,
          albumId,
        })
        await putToSignedUrl(signedLarge, large.blob, (f) => update(item.key, { progress: 0.1 + f * 0.75 }))
        const signedThumb = await requestSignedUpload({
          bucket: "galerie",
          kind: "thumb",
          fileName: `${base}.${extensionFor(thumb.type)}`,
          contentType: thumb.type,
          size: thumb.blob.size,
          albumId,
        })
        await putToSignedUrl(signedThumb, thumb.blob, (f) => update(item.key, { progress: 0.85 + f * 0.1 }))
        update(item.key, { status: "enregistrement", progress: 0.96 })
        const response = await fetch(`/api/galerie/albums/${albumId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photos: [
              {
                url: signedLarge.publicUrl,
                path: signedLarge.path,
                thumbUrl: signedThumb.publicUrl,
                thumbPath: signedThumb.path,
                width: large.width,
                height: large.height,
              },
            ],
          }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data)) {
          throw new Error((data && typeof data.error === "string" && data.error) || "Enregistrement de la photo impossible.")
        }
        update(item.key, { status: "termine", progress: 1, photoId: data[0].id })
        onUploaded(data[0])
      } catch (error) {
        update(item.key, {
          status: "erreur",
          error: error instanceof Error ? error.message : "Échec du téléversement.",
        })
      }
    },
    [albumId, onUploaded, update]
  )

  // File d'attente : au plus 3 traitements simultanés
  useEffect(() => {
    const waiting = items.filter((it) => it.status === "attente")
    const active = items.filter((it) => ["traitement", "envoi", "enregistrement"].includes(it.status)).length
    running.current = active
    const free = CONCURRENCY - active
    if (free <= 0 || waiting.length === 0) {
      // Fin de série : remise des nouvelles photos dans l'ordre de sélection
      if (active === 0 && waiting.length === 0 && batchKeys.current.length) {
        const keys = batchKeys.current
        const byKey = new Map(itemsRef.current.map((it) => [it.key, it]))
        if (keys.every((k) => ["termine", "erreur"].includes(byKey.get(k)?.status ?? ""))) {
          const ids = keys.map((k) => byKey.get(k)?.photoId).filter((id): id is string => Boolean(id))
          batchKeys.current = []
          if (ids.length) onBatchDone(ids)
        }
      }
      return
    }
    for (const item of waiting.slice(0, free)) {
      setItems((list) => list.map((it) => (it.key === item.key ? { ...it, status: "traitement" } : it)))
      void processItem(item)
    }
  }, [items, processItem, onBatchDone])

  const addFiles = (list: FileList | File[]) => {
    setMessage(null)
    const files = Array.from(list)
    const accepted = files.filter(isAcceptedImage)
    const rejected = files.length - accepted.length
    const pending = items.filter((it) => it.status !== "termine" && it.status !== "erreur").length
    const room = MAX_PHOTOS_PER_ALBUM - existingCount - pending
    const notes: string[] = []
    if (rejected) notes.push(`${rejected} fichier${rejected > 1 ? "s" : ""} ignoré${rejected > 1 ? "s" : ""} (formats acceptés : JPG, PNG, WebP).`)
    let selected = accepted
    if (selected.length > MAX_PHOTOS_PER_UPLOAD) {
      notes.push(`${MAX_PHOTOS_PER_UPLOAD} photos maximum par envoi : les ${selected.length - MAX_PHOTOS_PER_UPLOAD} dernières sont ignorées.`)
      selected = selected.slice(0, MAX_PHOTOS_PER_UPLOAD)
    }
    if (selected.length > room) {
      notes.push(`${MAX_PHOTOS_PER_ALBUM} photos maximum par album : ${Math.max(0, room)} place${room > 1 ? "s" : ""} restante${room > 1 ? "s" : ""}.`)
      selected = selected.slice(0, Math.max(0, room))
    }
    if (notes.length) setMessage(notes.join(" "))
    if (!selected.length) return
    const stamp = Date.now()
    const next = selected.map((file, i) => ({
      key: `${stamp}-${i}-${file.name}`,
      file,
      status: "attente" as const,
      progress: 0,
      error: null,
      photoId: null,
    }))
    batchKeys.current = [...batchKeys.current, ...next.map((n) => n.key)]
    setItems((list) => [...list.filter((it) => it.status !== "termine"), ...next])
  }

  const retry = (key: string) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, status: "attente", progress: 0, error: null } : it)))
  }

  const active = items.some((it) => it.status !== "termine" && it.status !== "erreur")
  const done = items.filter((it) => it.status === "termine").length

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border bg-white px-6 py-8 text-center transition-colors",
          dragOver ? "border-zinc-900 bg-zinc-50" : "border-zinc-300"
        )}
      >
        <Upload className="h-7 w-7 text-zinc-500" aria-hidden="true" />
        <p className="text-sm text-zinc-700">
          Glissez vos photos ici, ou{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center font-semibold text-[#C8151B] underline underline-offset-2"
          >
            choisissez des fichiers
          </button>
        </p>
        <p className="text-xs text-zinc-500">
          JPG, PNG ou WebP, {MAX_PHOTOS_PER_UPLOAD} par envoi, {MAX_PHOTOS_PER_ALBUM} par album ({existingCount} déjà).
          Redimensionnées à 2 400 px avec miniature, données EXIF (dont GPS) retirées.
        </p>
        <input
          ref={inputRef}
          id="galerie-fichiers"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          aria-label="Choisir des photos à ajouter"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
      {message && (
        <p role="status" className="text-sm text-amber-800">
          {message}
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2.5 text-sm">
            <span aria-live="polite">
              {active ? "Envoi en cours" : "Envoi terminé"} : {done} / {items.length} photo{items.length > 1 ? "s" : ""}
            </span>
            {!active && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setItems([])}>
                <X className="mr-1 h-4 w-4" aria-hidden="true" />
                Effacer la liste
              </Button>
            )}
          </div>
          <ul className="max-h-[320px] divide-y divide-zinc-100 overflow-y-auto" aria-label="Fichiers en cours d'envoi">
            {items.map((it) => (
              <li key={it.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {it.status === "termine" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : it.status === "erreur" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                ) : (
                  <Loader2 className={cn("h-4 w-4 shrink-0 text-zinc-500", it.status !== "attente" && "animate-spin")} aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-zinc-900">{it.file.name}</span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {STATUS_LABELS[it.status]}
                      {it.status !== "erreur" && it.status !== "attente" ? ` ${Math.round(it.progress * 100)} %` : ""}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Progression de ${it.file.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(it.progress * 100)}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100"
                  >
                    <div
                      className={cn("h-full transition-[width] duration-200", it.status === "erreur" ? "bg-red-500" : "bg-zinc-900")}
                      style={{ width: `${Math.round(it.progress * 100)}%` }}
                    />
                  </div>
                  {it.error && <p className="mt-1 text-xs text-red-600">{it.error}</p>}
                </div>
                {it.status === "erreur" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => retry(it.key)} className="min-h-[44px]">
                    <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                    Réessayer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
