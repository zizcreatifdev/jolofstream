"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  SITE_CONTENT_SCHEMAS,
  type SiteContentKey,
  type SiteContentMap,
} from "@/lib/site-content"

// Champs et enregistrement communs aux editeurs de contenu du site

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  max,
  required = false,
  multiline = false,
  rows = 3,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  max?: number
  required?: boolean
  multiline?: boolean
  rows?: number
  placeholder?: string
}) {
  const over = max !== undefined && value.length > max
  const describedBy = [hint && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(" ")
  const common = {
    id,
    value,
    placeholder,
    "aria-invalid": Boolean(error) || over,
    "aria-describedby": describedBy || undefined,
    className: cn((error || over) && "border-red-400"),
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-[#C8151B]"> *</span>}
        </Label>
        {max !== undefined && (
          <span className={cn("text-xs tabular-nums", over ? "text-red-600" : "text-zinc-500")}>
            {value.length} / {max}
          </span>
        )}
      </div>
      {multiline ? (
        <Textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input {...common} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && (
        <p id={`${id}-aide`} className="text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export type SaveStatus = { message: string; error: boolean } | null

// Validation locale (meme schema que l'API) puis PUT /api/site-content/<cle>
export function useContentSave<K extends SiteContentKey>(key: K) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<SaveStatus>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = async (value: SiteContentMap[K], successMessage: string) => {
    setStatus(null)
    const parsed = SITE_CONTENT_SCHEMAS[key].safeParse(value)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".")
        if (!next[path]) next[path] = issue.message
      }
      setErrors(next)
      setStatus({ message: "Corrigez les champs signalés.", error: true })
      return false
    }
    setErrors({})
    setSaving(true)
    try {
      const response = await fetch(`/api/site-content/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        if (Array.isArray(data?.issues)) {
          const next: Record<string, string> = {}
          for (const issue of data.issues as Array<{ path: string; message: string }>) {
            if (!next[issue.path]) next[issue.path] = issue.message
          }
          setErrors(next)
        }
        setStatus({ message: (data && data.error) || "Enregistrement impossible.", error: true })
        return false
      }
      setStatus({ message: successMessage, error: false })
      return true
    } catch {
      setStatus({ message: "Connexion impossible.", error: true })
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, status, errors }
}

// Bloc d'edition : titre, ou le contenu apparait, champs, enregistrement
export function ContentBlock({
  title,
  where,
  children,
  onSubmit,
  saving,
  status,
  submitLabel = "Enregistrer",
}: {
  title: string
  where: string
  children: React.ReactNode
  onSubmit: () => void
  saving: boolean
  status: SaveStatus
  submitLabel?: string
}) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4 rounded-xl border border-zinc-200 p-5"
    >
      <div className="border-b border-zinc-100 pb-3">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{where}</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4">
        {status && (
          <p role="status" className={cn("text-sm", status.error ? "text-red-600" : "text-emerald-600")}>
            {status.message}
          </p>
        )}
        <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
