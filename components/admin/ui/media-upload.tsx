"use client"

import { useRef, useState } from "react"
import { Film, ImageIcon, Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBrowserSupabase } from "@/lib/supabase-browser"
import { uploadRule, type UploadTarget } from "@/lib/storage-buckets"

// Televersement d'un media (video ou image du hero, image de contenu du bucket
// site) directement vers Supabase Storage via une URL signee
// (/api/storage/signed-upload). L'ancien fichier est supprime par le serveur
// a l'enregistrement du contenu qui le reference.
export function MediaUpload({
  target,
  id,
  value,
  onChange,
  label,
  hint,
  required = false,
  error,
}: {
  target: UploadTarget
  id?: string
  value: string | null
  onChange: (url: string | null) => void
  label: string
  hint?: string
  required?: boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const rules = uploadRule(target)
  const kind = target.kind
  const isVideo = kind === "video"
  const inputId = id ?? `media-${target.bucket}-${kind}`

  const upload = async (file: File) => {
    setMessage(null)
    setWarning(null)
    if (!(rules.types as readonly string[]).includes(file.type)) {
      setMessage(`Format non accepte. Attendu : ${rules.label}.`)
      return
    }
    if (file.size > rules.maxBytes) {
      setMessage(
        `Fichier trop lourd (${file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} Ko` : `${(file.size / 1024 / 1024).toFixed(1)} Mo`}). Attendu : ${rules.label}.`
      )
      return
    }
    setUploading(true)
    try {
      const response = await fetch("/api/storage/signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: target.bucket,
          kind,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.token) {
        setMessage((data && typeof data.error === "string" && data.error) || "Upload impossible.")
        return
      }
      const { error: uploadError } = await getBrowserSupabase()
        .storage.from(data.bucket)
        .uploadToSignedUrl(data.path, data.token, file, {
          contentType: file.type,
          cacheControl: "31536000",
        })
      if (uploadError) {
        setMessage(`Echec de l'upload : ${uploadError.message}`)
        return
      }
      onChange(data.publicUrl as string)
      if (target.bucket === "hero" && kind === "poster") checkPosterSize(file)
    } catch {
      setMessage("Connexion impossible. Reessayez.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  // Simple avertissement : 1920 x 1080 recommande
  const checkPosterSize = (file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth < 1600 || Math.abs(img.naturalWidth / img.naturalHeight - 16 / 9) > 0.05) {
        setWarning(
          `Image de ${img.naturalWidth} x ${img.naturalHeight} px : 1920 x 1080 recommande pour un rendu net en plein ecran.`
        )
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const Icon = isVideo ? Film : ImageIcon

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-900">
        {label}
        {required && <span className="text-[#C8151B]"> *</span>}
      </label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}

      <div
        className={cn(
          "relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg border bg-zinc-50",
          error ? "border-red-400" : "border-zinc-200"
        )}
      >
        {value ? (
          isVideo ? (
            <video src={value} muted loop playsInline controls className="h-full w-full bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`Apercu : ${label}`} className="h-full w-full object-cover" />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-zinc-500">
            <Icon className="h-6 w-6" aria-hidden="true" />
            Aucun fichier
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-700" aria-label="Upload en cours" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={rules.extensions}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {value ? "Remplacer" : "Televerser"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => onChange(null)}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Retirer
          </Button>
        )}
      </div>
      <p className="text-xs text-zinc-500">{rules.label}</p>
      {message && <p className="text-xs text-red-600">{message}</p>}
      {warning && <p className="text-xs text-amber-700">{warning}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
