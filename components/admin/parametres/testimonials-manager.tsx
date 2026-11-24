"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  PUBLISH_WITHOUT_CONSENT_MESSAGE,
  QUOTE_MAX,
  TESTIMONIAL_CONTEXTS,
  TESTIMONIAL_CONTEXT_LABELS,
  initialsOf,
  testimonialInputSchema,
  type TestimonialContextValue,
  type TestimonialView,
} from "@/lib/testimonials"
import { MediaUpload } from "@/components/admin/ui/media-upload"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import { TextField } from "@/components/admin/parametres/content-fields"

type Filter = "ALL" | TestimonialContextValue

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "GENERAL", label: "Général" },
  { value: "FORMATION", label: "Formation" },
]

type FormState = {
  quote: string
  authorName: string
  authorRole: string
  photoUrl: string | null
  context: TestimonialContextValue
  consent: boolean
  published: boolean
}

const EMPTY_FORM: FormState = {
  quote: "",
  authorName: "",
  authorRole: "",
  photoUrl: null,
  context: "GENERAL",
  consent: false,
  published: false,
}

// Parametres > Contenu du site > Temoignages
export function TestimonialsManager() {
  const [items, setItems] = useState<TestimonialView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("ALL")
  const [editing, setEditing] = useState<TestimonialView | "new" | null>(null)
  const [deleting, setDeleting] = useState<TestimonialView | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/testimonials", { cache: "no-store" })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        setError((data && data.error) || "Chargement impossible.")
        return
      }
      setItems(data.testimonials as TestimonialView[])
    } catch {
      setError("Connexion impossible.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((t) => t.context === filter)),
    [items, filter]
  )

  // Deplacement dans la vue filtree : les autres temoignages gardent leur place
  const move = async (from: number, to: number) => {
    const reordered = moveItem(visible, from, to)
    if (reordered === visible) return
    const slots = items
      .map((t, i) => (visible.includes(t) ? i : -1))
      .filter((i) => i >= 0)
    const next = [...items]
    slots.forEach((slot, k) => {
      next[slot] = reordered[k]
    })
    const previous = items
    setItems(next)
    setError(null)
    try {
      const response = await fetch("/api/testimonials/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((t) => t.id) }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setItems(previous)
        setError((data && data.error) || "Nouvel ordre non enregistré.")
        return
      }
      setNotice("Ordre enregistré.")
    } catch {
      setItems(previous)
      setError("Connexion impossible.")
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      const response = await fetch(`/api/testimonials/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError((data && data.error) || "Suppression impossible.")
        return
      }
      setItems((prev) => prev.filter((t) => t.id !== deleting.id))
      setNotice("Témoignage supprimé.")
      setDeleting(null)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Témoignages</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Général : section Témoignages de l&apos;accueil (6 premiers publiés). Formation :
          parcours d&apos;anciens de la page Formations. Un témoignage n&apos;est publié
          qu&apos;avec l&apos;accord de la personne.
        </p>
      </div>

      <div role="group" aria-label="Filtrer les témoignages" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={filter === f.value}
            className={cn(
              filter === f.value &&
                "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
            )}
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({f.value === "ALL" ? items.length : items.filter((t) => t.context === f.value).length})
          </Button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement...
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
          Aucun témoignage dans cette vue.
        </p>
      ) : (
        <SortableList
          label="Témoignages"
          itemLabel="le témoignage"
          items={visible}
          getKey={(t) => t.id}
          onMove={(from, to) => void move(from, to)}
          actions={(t, i) => (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(t)}
                aria-label={`Modifier le témoignage ${i + 1}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(t)}
                aria-label={`Supprimer le témoignage ${i + 1}`}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          renderItem={(t) => (
            <div className="flex items-start gap-3">
              {t.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                  {initialsOf(t.authorName)}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{t.authorName}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      t.published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                    )}
                  >
                    {t.published ? "Publié" : "Brouillon"}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {t.context === "GENERAL" ? "Général" : "Formation"}
                  </span>
                  {!t.consent && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Accord à obtenir
                    </span>
                  )}
                </div>
                {t.authorRole && <p className="text-xs text-zinc-500">{t.authorRole}</p>}
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{t.quote}</p>
              </div>
            </div>
          )}
        />
      )}

      <Button
        type="button"
        onClick={() => setEditing("new")}
        className="bg-[#C8151B] text-white hover:bg-[#a01015]"
      >
        <Plus className="mr-1.5 h-4 w-4" /> Nouveau témoignage
      </Button>

      <TestimonialForm
        target={editing}
        defaultContext={filter === "FORMATION" ? "FORMATION" : "GENERAL"}
        onClose={() => setEditing(null)}
        onSaved={(saved, created) => {
          setItems((prev) => (created ? [...prev, saved] : prev.map((t) => (t.id === saved.id ? saved : t))))
          setNotice(created ? "Témoignage créé." : "Témoignage enregistré.")
          setEditing(null)
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce témoignage ?</DialogTitle>
            <DialogDescription>
              {deleting ? `Le témoignage de ${deleting.authorName} sera supprimé, ainsi que sa photo. Cette action est définitive.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteBusy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteBusy ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TestimonialForm({
  target,
  defaultContext,
  onClose,
  onSaved,
}: {
  target: TestimonialView | "new" | null
  defaultContext: TestimonialContextValue
  onClose: () => void
  onSaved: (saved: TestimonialView, created: boolean) => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const creating = target === "new"

  useEffect(() => {
    if (!target) return
    setForm(
      target === "new"
        ? { ...EMPTY_FORM, context: defaultContext }
        : {
            quote: target.quote,
            authorName: target.authorName,
            authorRole: target.authorRole ?? "",
            photoUrl: target.photoUrl,
            context: target.context,
            consent: target.consent,
            published: target.published,
          }
    )
    setErrors({})
    setServerError(null)
  }, [target, defaultContext])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    setServerError(null)
    const payload = { ...form, authorRole: form.authorRole || null }
    const parsed = testimonialInputSchema.safeParse(payload)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form")
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      setServerError("Corrigez les champs signalés.")
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const response = await fetch(
        creating ? "/api/testimonials" : `/api/testimonials/${(target as TestimonialView).id}`,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        setServerError((data && data.error) || "Enregistrement impossible.")
        return
      }
      onSaved(data as TestimonialView, creating)
    } catch {
      setServerError("Connexion impossible. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={Boolean(target)} onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:!max-w-[560px]">
        <SheetHeader>
          <SheetTitle>{creating ? "Nouveau témoignage" : "Modifier le témoignage"}</SheetTitle>
          <SheetDescription>
            Publication possible uniquement avec l&apos;accord écrit ou oral de la personne citée.
          </SheetDescription>
        </SheetHeader>

        <form
          noValidate
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {serverError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}
          <TextField
            id="tm-quote"
            label="Citation"
            required
            value={form.quote}
            onChange={(quote) => set("quote", quote)}
            error={errors.quote}
            max={QUOTE_MAX}
            multiline
            rows={5}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="tm-name"
              label="Nom"
              required
              value={form.authorName}
              onChange={(v) => set("authorName", v)}
              error={errors.authorName}
              max={80}
            />
            <TextField
              id="tm-role"
              label="Rôle (fonction, organisation ou parcours)"
              value={form.authorRole}
              onChange={(v) => set("authorRole", v)}
              error={errors.authorRole}
              max={120}
            />
          </div>
          <MediaUpload
            id="tm-photo"
            target={{ bucket: "site", kind: "image" }}
            value={form.photoUrl}
            onChange={(url) => set("photoUrl", url)}
            label="Photo (facultative)"
            hint="Format carré. Sans photo : initiales dans un cercle."
            error={errors.photoUrl}
          />
          <div className="space-y-1.5">
            <Label htmlFor="tm-context">Contexte</Label>
            <Select value={form.context} onValueChange={(v) => set("context", v as TestimonialContextValue)}>
              <SelectTrigger id="tm-context">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TESTIMONIAL_CONTEXTS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {TESTIMONIAL_CONTEXT_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <label className="flex items-start gap-3 text-sm text-zinc-900">
              <input
                id="tm-consent"
                type="checkbox"
                checked={form.consent}
                onChange={(e) => {
                  const consent = e.target.checked
                  setForm((prev) => ({ ...prev, consent, published: consent ? prev.published : false }))
                }}
                className="mt-0.5 h-4 w-4 accent-[#C8151B]"
              />
              <span>
                <span className="font-medium">Accord de publication obtenu</span>
                <span className="block text-xs text-zinc-500">
                  La personne a accepté que sa citation, son nom et sa photo soient publiés.
                </span>
              </span>
            </label>
            <div className="flex items-start gap-3">
              <Switch
                id="tm-published"
                checked={form.published}
                disabled={!form.consent}
                onCheckedChange={(v) => set("published", v)}
                aria-describedby="tm-published-aide"
              />
              <div>
                <Label htmlFor="tm-published" className={cn(!form.consent && "text-zinc-400")}>
                  Publier sur le site
                </Label>
                <p id="tm-published-aide" className="text-xs text-zinc-500">
                  {form.consent
                    ? "Le témoignage apparaît sur le site dès l'enregistrement."
                    : "Cochez d'abord l'accord de publication : sans accord, le témoignage reste en brouillon."}
                </p>
                {errors.published && <p className="text-xs text-red-600">{errors.published}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
          <p className="sr-only">{PUBLISH_WITHOUT_CONSENT_MESSAGE}</p>
        </form>
      </SheetContent>
    </Sheet>
  )
}
