"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Bucket = "avatars" | "signatures" | "portfolio" | "equipe"
type AspectRatio = "square" | "landscape" | "signature"

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  square: "h-24 w-24 rounded-full",
  landscape: "aspect-video w-full rounded-lg",
  signature: "h-24 w-72 rounded-md bg-white",
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

function extractPathFromPublicUrl(
  url: string,
  bucket: string
): string | null {
  // Format Supabase : .../storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  label,
  hint,
  aspectRatio = "square",
  maxSizeMB = 5,
  path,
}: {
  value: string
  onChange: (url: string) => void
  bucket: Bucket
  label?: string
  hint?: string
  aspectRatio?: AspectRatio
  maxSizeMB?: number
  path?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const triggerSelect = () => {
    inputRef.current?.click()
  }

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Type non supporte : ${file.type}. Acceptes : JPG, PNG, WebP, GIF.`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Fichier trop volumineux : ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum ${maxSizeMB} MB.`
    }
    return null
  }

  const upload = async (file: File) => {
    setError(null)
    const v = validate(file)
    if (v) {
      setError(v)
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", bucket)
      if (path) fd.append("path", path)

      const r = await fetch("/api/storage/upload", {
        method: "POST",
        body: fd,
      })
      const data = await r.json().catch(() => null)
      if (!r.ok || !data?.url) {
        throw new Error(data?.error || "Echec de l'upload")
      }
      onChange(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const remove = async () => {
    if (!value) return
    setError(null)
    setDeleting(true)
    try {
      const filePath = extractPathFromPublicUrl(value, bucket)
      if (filePath) {
        await fetch("/api/storage/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket, path: filePath }),
        }).catch(() => {
          // suppression best-effort, on continue meme si elle echoue
        })
      }
      onChange("")
    } finally {
      setDeleting(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const aspectClass = ASPECT_CLASSES[aspectRatio]
  const busy = uploading || deleting

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}

      {value ? (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "relative overflow-hidden border border-zinc-200",
              aspectClass
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label ?? "Aperçu"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerSelect}
              disabled={busy}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Changer
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={remove}
              disabled={busy}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </>
              )}
            </Button>
            {hint && <p className="text-xs text-zinc-500">{hint}</p>}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !busy && triggerSelect()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-zinc-50 px-4 py-8 text-center transition-colors",
            dragOver
              ? "border-[#C8151B] bg-red-50"
              : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100",
            busy && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          ) : (
            <Upload className="h-6 w-6 text-zinc-400" />
          )}
          <p className="text-sm font-medium text-zinc-700">
            {uploading
              ? "Upload en cours..."
              : "Cliquez ou glissez une image ici"}
          </p>
          {hint && <p className="text-xs text-zinc-500">{hint}</p>}
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            JPG, PNG, WebP, GIF - max {maxSizeMB} MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Suppress unused import
void Image
