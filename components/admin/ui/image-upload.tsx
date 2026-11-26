"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { optimizedMessage, type ImageProfileName } from "@/lib/image-profiles"
import { IMAGE_ACCEPT, compressImage, extensionFor } from "@/lib/image-resize"
import { uploadBlob } from "@/lib/signed-upload-client"

type Bucket = "avatars" | "signatures" | "portfolio" | "equipe"
type AspectRatio = "square" | "square-lg" | "landscape" | "signature"

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  square: "h-24 w-24 rounded-full",
  "square-lg": "h-[200px] w-[200px] rounded-lg border bg-[#fafafa]",
  landscape: "aspect-video w-full rounded-lg",
  signature: "h-24 w-72 rounded-md bg-white",
}

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

// Envoi d'une image des buckets V1 (avatars, signatures, equipe, portfolio) :
// compression dans le navigateur selon le profil (lib/image-profiles.ts),
// puis envoi direct par URL signée avec progression.
export function ImageUpload({
  value,
  onChange,
  bucket,
  profile,
  label,
  hint,
  aspectRatio = "square",
}: {
  value: string
  onChange: (url: string) => void
  bucket: Bucket
  profile: ImageProfileName
  label?: string
  hint?: string
  aspectRatio?: AspectRatio
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)

  // Quitter la page pendant un envoi : alerte
  useEffect(() => {
    if (!uploading) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [uploading])

  const triggerSelect = () => {
    inputRef.current?.click()
  }

  const send = async (file: File, forceJpeg: boolean) => {
    const image = await compressImage(file, profile, { forceJpeg })
    setProgress(0.05)
    const signed = await uploadBlob({
      bucket,
      kind: "image",
      fileName: `${file.name.replace(/\.[^.]+$/, "") || "image"}.${extensionFor(image.type)}`,
      blob: image.blob,
      contentType: image.type,
      onProgress: (f) => setProgress(0.05 + f * 0.95),
    })
    onChange(signed.publicUrl)
    setResult(optimizedMessage("Image", image.originalSize, image.blob.size))
  }

  const upload = async (file: File) => {
    setError(null)
    setResult(null)
    setProgress(0)
    setUploading(true)
    try {
      try {
        await send(file, false)
      } catch (e) {
        // Bucket V1 qui refuserait le WebP : nouvel essai en JPEG
        if (e instanceof Error && /mime/i.test(e.message)) await send(file, true)
        else throw e
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de téléversement")
    } finally {
      setUploading(false)
      setProgress(0)
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
              className={cn(
                "h-full w-full",
                aspectRatio === "square-lg" ? "object-contain" : "object-cover"
              )}
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
                  Téléversement...
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
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label={`${label ?? "Image"} : cliquez ou glissez une image`}
          onClick={() => !busy && triggerSelect()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !busy) {
              e.preventDefault()
              triggerSelect()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border bg-zinc-50 px-4 py-8 text-center transition-colors",
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
              ? "Téléversement en cours..."
              : "Cliquez ou glissez une image ici"}
          </p>
          {hint && <p className="text-xs text-zinc-500">{hint}</p>}
          <p className="text-xs text-zinc-500">
            JPG, PNG, WebP, GIF ou HEIC : image optimisée automatiquement avant l&apos;envoi.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        aria-label={label ?? "Image"}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />

      <div aria-live="polite" className="space-y-1">
        {uploading && (
          <>
            <p className="text-xs font-medium text-zinc-700">
              {progress < 0.05 ? "Optimisation de l'image" : `Envoi : ${Math.round(progress * 100)} %`}
            </p>
            <div
              role="progressbar"
              aria-label="Téléversement de l'image"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="h-1.5 max-w-xs overflow-hidden rounded-full bg-zinc-200"
            >
              <div className="h-full bg-zinc-900 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </>
        )}
        {result && !uploading && <p className="text-xs font-medium text-emerald-700">{result}</p>}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

