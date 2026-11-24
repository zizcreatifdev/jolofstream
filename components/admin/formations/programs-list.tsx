"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import { BADGE_STYLES } from "@/lib/badge-styles"
import { formatPrice } from "@/lib/formations"
import type { ProgramListItem } from "@/lib/training-program-stats"
import { slugify } from "@/lib/training-programs"
import { cn } from "@/lib/utils"

function Pill({ tone, children }: { tone: keyof typeof BADGE_STYLES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", BADGE_STYLES[tone])}>
      {children}
    </span>
  )
}

// /admin/formations : programmes ordonnables avec leurs chiffres
export function ProgramsList({ initial }: { initial: ProgramListItem[] }) {
  const router = useRouter()
  const [programs, setPrograms] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => setPrograms(initial), [initial])

  useEffect(() => {
    const handler = () => setCreateOpen(true)
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const move = async (from: number, to: number) => {
    const previous = programs
    const next = moveItem(programs, from, to)
    if (next === programs) return
    setPrograms(next)
    setError(null)
    try {
      const r = await fetch("/api/formations/programmes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setPrograms(previous)
        setError((data && typeof data.error === "string" && data.error) || "Ordre non enregistré.")
      }
    } catch {
      setPrograms(previous)
      setError("Connexion impossible. Ordre non enregistré.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {programs.length} programme{programs.length > 1 ? "s" : ""}. L&apos;ordre est celui du site public.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Nouveau programme
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
          Aucun programme. Créez le premier pour y ajouter des cohortes.
        </div>
      ) : (
        <SortableList
          label="Programmes de formation"
          itemLabel="le programme"
          items={programs}
          getKey={(p) => p.id}
          onMove={(from, to) => void move(from, to)}
          renderItem={(p) => (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/formations/programmes/${p.id}`}
                    className="text-base font-semibold text-zinc-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.code && <span className="text-xs font-medium text-zinc-500">{p.code}</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.published ? <Pill tone="active">Publié</Pill> : <Pill tone="muted">Masqué</Pill>}
                  {p.hasBrochure ? (
                    <Pill tone={p.brochurePublished ? "active" : "draft"}>
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      {p.brochurePublished ? "Plaquette publiée" : "Plaquette non publiée"}
                    </Pill>
                  ) : (
                    <Pill tone="draft">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      Sans plaquette
                    </Pill>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-[520px]">
                <Figure label="Cohortes ouvertes" value={`${p.openCohorts} / ${p.cohorts}`} />
                <Figure label="Inscrits" value={String(p.registered)} />
                <Figure label="Confirmés" value={String(p.confirmed)} />
                <Figure label="Encaissé" value={formatPrice(p.collected)} />
              </dl>
            </div>
          )}
        />
      )}

      <CreateProgramDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/admin/formations/programmes/${id}`)}
      />
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-2.5 py-1.5">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="font-semibold text-zinc-900">{value}</dd>
    </div>
  )
}

function CreateProgramDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName("")
    setSlug("")
    setSlugEdited(false)
    setCode("")
    setError(null)
  }, [open])

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch("/api/formations/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, code, published: false }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        const issue = data?.issues ? Object.values(data.issues as Record<string, string[]>)[0]?.[0] : null
        setError(issue || (typeof data?.error === "string" ? data.error : "Création impossible."))
        return
      }
      onOpenChange(false)
      onCreated(data.id)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau programme</DialogTitle>
          <DialogDescription>
            Le programme est créé masqué : complétez sa fiche, puis publiez-le.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-program-name">Nom *</Label>
            <Input
              id="new-program-name"
              value={name}
              maxLength={120}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugEdited) setSlug(slugify(e.target.value))
              }}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="new-program-slug">Adresse *</Label>
              <Input
                id="new-program-slug"
                value={slug}
                maxLength={80}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugEdited(true)
                }}
              />
              <p className="text-xs text-zinc-500">jolofstream.com/formations/{slug || "..."}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-program-code">Code</Label>
              <Input id="new-program-code" value={code} maxLength={20} onChange={(e) => setCode(e.target.value)} placeholder="F-XXX" />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !slug.trim()} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
              {saving ? "Création..." : "Créer le programme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
