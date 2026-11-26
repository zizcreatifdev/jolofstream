"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { extractYoutubeId } from "@/lib/portfolio"
import {
  HERO_DURATION_MAX,
  HERO_DURATION_MIN,
  HERO_VIDEO_TYPES,
  HERO_VIDEO_TYPE_LABELS,
  MAX_HERO_SLIDES,
  YOUTUBE_FORMATS_HINT,
  heroSlideInputSchema,
  parseSlideDuration,
  slideTabLabel,
  youtubeThumbnailUrl,
  type HeroSlideInput,
  type HeroSlideView,
  type HeroVideoTypeValue,
} from "@/lib/hero-slides"
import { MediaUpload } from "@/components/admin/ui/media-upload"
import { NEXT_COHORT_TOKEN, applyBadgeToken } from "@/lib/hero-badge"
import { HeroCarousel } from "@/components/public/hero/hero-carousel"

type SaveParams = (
  patch: Record<string, string>
) => Promise<{ ok: boolean; error?: string }>

type FormState = {
  active: boolean
  kicker: string
  titleLine1: string
  titleLine2: string
  accentText: string
  description: string
  videoType: HeroVideoTypeValue
  youtubeUrl: string
  mp4Url: string | null
  posterUrl: string | null
  cta1Label: string
  cta1Href: string
  cta2Label: string
  cta2Href: string
  soundLabel: string
  badgeText: string
}

const EMPTY_FORM: FormState = {
  active: true,
  kicker: "",
  titleLine1: "",
  titleLine2: "",
  accentText: "",
  description: "",
  videoType: "NONE",
  youtubeUrl: "",
  mp4Url: null,
  posterUrl: null,
  cta1Label: "Demander un devis",
  cta1Href: "/contact",
  cta2Label: "",
  cta2Href: "",
  soundLabel: "Regarder avec le son",
  badgeText: "",
}

function formFromSlide(slide: HeroSlideView): FormState {
  return {
    active: slide.active,
    kicker: slide.kicker,
    titleLine1: slide.titleLine1,
    titleLine2: slide.titleLine2,
    accentText: slide.accentText ?? "",
    description: slide.description,
    videoType: slide.videoType,
    youtubeUrl: slide.youtubeUrl ?? "",
    mp4Url: slide.mp4Url,
    posterUrl: slide.posterUrl,
    cta1Label: slide.cta1Label,
    cta1Href: slide.cta1Href,
    cta2Label: slide.cta2Label ?? "",
    cta2Href: slide.cta2Href ?? "",
    soundLabel: slide.soundLabel,
    badgeText: slide.badgeText ?? "",
  }
}

function toPayload(form: FormState): HeroSlideInput {
  return {
    ...form,
    accentText: form.accentText || null,
    youtubeUrl: form.youtubeUrl || null,
    cta2Label: form.cta2Label || null,
    cta2Href: form.cta2Href || null,
    badgeText: form.badgeText || null,
  }
}

// Slide telle qu'affichee sur le site, pour l'apercu (meme rendu public)
function draftView(form: FormState, id = "apercu"): HeroSlideView {
  const youtubeId =
    form.videoType === "YOUTUBE" ? extractYoutubeId(form.youtubeUrl) : null
  return {
    id,
    order: 0,
    active: true,
    kicker: form.kicker || "Surtitre",
    titleLine1: form.titleLine1 || "Titre ligne 1",
    titleLine2: form.titleLine2 || "titre ligne 2",
    accentText: form.accentText || null,
    description: form.description,
    videoType: form.videoType,
    youtubeUrl: form.youtubeUrl || null,
    youtubeId,
    mp4Url: form.videoType === "MP4" ? form.mp4Url : null,
    posterUrl: form.posterUrl,
    cta1Label: form.cta1Label || "Bouton",
    cta1Href: form.cta1Href || "/",
    cta2Label: form.cta2Label || null,
    cta2Href: form.cta2Href || null,
    soundLabel: form.soundLabel || "Regarder avec le son",
    badgeText: form.badgeText || null,
  }
}

function issuesToErrors(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form")
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}

// Parametres > Contenu du site > Hero : slides du carrousel video
export function HeroSlidesManager({
  params,
  onSave,
}: {
  params: Record<string, string>
  onSave: SaveParams
}) {
  const [slides, setSlides] = useState<HeroSlideView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<HeroSlideView | "new" | null>(null)
  const [deleting, setDeleting] = useState<HeroSlideView | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [preview, setPreview] = useState<HeroSlideView | null>(null)
  // Valeur actuelle du jeton {prochaine-cohorte} (null : aucune cohorte ouverte)
  const [nextCohort, setNextCohort] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [duration, setDuration] = useState(
    String(parseSlideDuration(params.hero_slide_duration))
  )
  const [durationStatus, setDurationStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/hero-slides", { cache: "no-store" })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        setError((data && data.error) || "Chargement impossible.")
        return
      }
      setSlides(data.slides as HeroSlideView[])
      setNextCohort(typeof data.nextCohort === "string" ? data.nextCohort : null)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const persistOrder = async (next: HeroSlideView[]) => {
    const previous = slides
    setSlides(next)
    setError(null)
    try {
      const response = await fetch("/api/hero-slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setSlides(previous)
        setError((data && data.error) || "Nouvel ordre non enregistré.")
        return
      }
      setNotice("Ordre enregistré.")
    } catch {
      setSlides(previous)
      setError("Connexion impossible.")
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length || from === to) return
    const next = [...slides]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    void persistOrder(next)
  }

  const toggleActive = async (slide: HeroSlideView, active: boolean) => {
    setError(null)
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, active } : s)))
    try {
      const response = await fetch(`/api/hero-slides/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, active: !active } : s))
        )
        setError((data && data.error) || "Mise à jour impossible.")
      }
    } catch {
      setError("Connexion impossible.")
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/hero-slides/${deleting.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError((data && data.error) || "Suppression impossible.")
        return
      }
      setSlides((prev) => prev.filter((s) => s.id !== deleting.id))
      setNotice("Slide supprimée.")
      setDeleting(null)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleteBusy(false)
    }
  }

  const saveDuration = async () => {
    const value = Number.parseInt(duration, 10)
    if (!Number.isFinite(value) || value < HERO_DURATION_MIN || value > HERO_DURATION_MAX) {
      setDurationStatus({
        message: `Entre ${HERO_DURATION_MIN} et ${HERO_DURATION_MAX} secondes.`,
        error: true,
      })
      return
    }
    const result = await onSave({ hero_slide_duration: String(value) })
    setDurationStatus(
      result.ok
        ? { message: "Durée enregistrée.", error: false }
        : { message: result.error ?? "Erreur", error: true }
    )
  }

  const full = slides.length >= MAX_HERO_SLIDES
  const activeCount = slides.filter((s) => s.active).length

  return (
    <section className="space-y-5">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Hero de l&apos;accueil</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Carrousel vidéo plein écran : {MAX_HERO_SLIDES} slides maximum. Glissez une
          slide pour changer l&apos;ordre (ou utilisez les flèches).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="hero-duration">Durée d&apos;une slide (secondes)</Label>
          <Input
            id="hero-duration"
            type="number"
            inputMode="numeric"
            min={HERO_DURATION_MIN}
            max={HERO_DURATION_MAX}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-32 bg-white"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void saveDuration()}>
          Enregistrer la durée
        </Button>
        {durationStatus && (
          <p className={cn("text-sm", durationStatus.error ? "text-red-600" : "text-emerald-600")}>
            {durationStatus.message}
          </p>
        )}
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
      {!loading && activeCount === 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Aucune slide active : le site affiche le hero statique de repli.
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des slides...
        </p>
      ) : (
        <ol className="space-y-2" aria-label="Slides du hero">
          {slides.map((slide, i) => (
            <li
              key={slide.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(i)
                e.dataTransfer.effectAllowed = "move"
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setOverIndex(i)
              }}
              onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex !== null) move(dragIndex, i)
                setDragIndex(null)
                setOverIndex(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3",
                overIndex === i && dragIndex !== i ? "border-zinc-900" : "border-zinc-200",
                dragIndex === i && "opacity-50"
              )}
            >
              <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-zinc-400" aria-hidden="true" />
              <span className="w-6 text-sm font-semibold text-zinc-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {slide.titleLine1} {slide.titleLine2}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {slideTabLabel(slide)} · {HERO_VIDEO_TYPE_LABELS[slide.videoType]}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-600">
                <Switch
                  checked={slide.active}
                  onCheckedChange={(v) => void toggleActive(slide, v)}
                  aria-label={`Slide ${i + 1} active`}
                />
                {slide.active ? "Active" : "Inactive"}
              </label>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Monter la slide ${i + 1}`}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => move(i, i + 1)} disabled={i === slides.length - 1} aria-label={`Descendre la slide ${i + 1}`}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(slide)} aria-label={`Prévisualiser la slide ${i + 1}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(slide)} aria-label={`Modifier la slide ${i + 1}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(slide)}
                  aria-label={`Supprimer la slide ${i + 1}`}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          {slides.length === 0 && (
            <li className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
              Aucune slide pour le moment.
            </li>
          )}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => setEditing("new")}
          disabled={full || loading}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle slide
        </Button>
        {full && (
          <p className="text-sm text-zinc-500">
            {MAX_HERO_SLIDES} slides maximum : supprimez-en une pour en ajouter une autre.
          </p>
        )}
      </div>

      <SlideFormSheet
        target={editing}
        onClose={() => setEditing(null)}
        onPreview={setPreview}
        nextCohort={nextCohort}
        onSaved={(saved, created) => {
          setSlides((prev) =>
            created ? [...prev, saved] : prev.map((s) => (s.id === saved.id ? saved : s))
          )
          setNotice(created ? "Slide créée." : "Slide enregistrée.")
          setEditing(null)
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette slide ?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `"${deleting.titleLine1} ${deleting.titleLine2}" sera retirée du hero, ainsi que ses fichiers téléversés. Cette action est définitive.`
                : null}
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

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-5xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Prévisualisation de la slide</DialogTitle>
            <DialogDescription>
              Rendu du site public en 1440 x 810, a l&apos;échelle. Les vidéos de fond
              démarrent après quelques secondes.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <PreviewFrame>
              <HeroCarousel
                slides={[{ ...preview, badgeText: applyBadgeToken(preview.badgeText, nextCohort) }]}
                duration={parseSlideDuration(duration)}
                preview
              />
            </PreviewFrame>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

// Cadre 16:9 qui affiche le hero à sa taille de bureau, mis a l'echelle
function PreviewFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setScale(node.clientWidth / 1440)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
      <div
        className="absolute left-0 top-0 h-[810px] w-[1440px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}

function SlideFormSheet({
  target,
  onClose,
  onSaved,
  onPreview,
  nextCohort,
}: {
  target: HeroSlideView | "new" | null
  onClose: () => void
  onSaved: (slide: HeroSlideView, created: boolean) => void
  onPreview: (slide: HeroSlideView) => void
  nextCohort: string | null
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const creating = target === "new"

  useEffect(() => {
    if (!target) return
    setForm(target === "new" ? EMPTY_FORM : formFromSlide(target))
    setErrors({})
    setServerError(null)
  }, [target])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const youtubeId = form.youtubeUrl ? extractYoutubeId(form.youtubeUrl) : null
  const youtubeInvalid = form.videoType === "YOUTUBE" && form.youtubeUrl.trim() !== "" && !youtubeId

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setServerError(null)
    const payload = toPayload(form)
    const parsed = heroSlideInputSchema.safeParse(payload)
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      setServerError("Corrigez les champs signalés.")
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const response = await fetch(
        creating ? "/api/hero-slides" : `/api/hero-slides/${(target as HeroSlideView).id}`,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        if (data?.issues && typeof data.issues === "object") {
          const fieldErrors: Record<string, string> = {}
          for (const [key, messages] of Object.entries(data.issues as Record<string, unknown>)) {
            if (Array.isArray(messages) && typeof messages[0] === "string") fieldErrors[key] = messages[0]
          }
          setErrors(fieldErrors)
        }
        setServerError((data && data.error) || "Enregistrement impossible.")
        return
      }
      onSaved(data as HeroSlideView, creating)
    } catch {
      setServerError("Connexion impossible. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    options: { required?: boolean; placeholder?: string; hint?: string } = {}
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`hero-${key}`}>
        {label}
        {options.required && <span className="text-[#C8151B]"> *</span>}
      </Label>
      <Input
        id={`hero-${key}`}
        value={String(form[key] ?? "")}
        onChange={(e) => set(key, e.target.value as never)}
        placeholder={options.placeholder}
        aria-invalid={Boolean(errors[key])}
        className={cn(errors[key] && "border-red-400")}
      />
      {options.hint && <p className="text-xs text-zinc-500">{options.hint}</p>}
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  )

  return (
    <Sheet open={Boolean(target)} onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:!max-w-[640px]">
        <SheetHeader>
          <SheetTitle>{creating ? "Nouvelle slide" : "Modifier la slide"}</SheetTitle>
          <SheetDescription>
            Les champs marques * sont obligatoires. Aperçu du rendu public avec le bouton Prévisualiser.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          {serverError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}

          <label className="flex items-center gap-3 text-sm font-medium text-zinc-900">
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
            Slide active sur le site
          </label>

          {field("kicker", "Surtitre", {
            required: true,
            placeholder: "Showreel 2026 · Captation et streaming",
            hint: "Le début, avant le point médian, sert de libellé à l'onglet.",
          })}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("titleLine1", "Titre, ligne 1", { required: true, placeholder: "Capturez l’instant," })}
            {field("titleLine2", "Titre, ligne 2", { required: true, placeholder: "diffusez l’émotion." })}
          </div>
          {field("accentText", "Texte accentué (italique jaune)", {
            placeholder: "diffusez",
            hint: "Portion exacte de la ligne 2. Laissez vide pour aucun accent.",
          })}
          <div className="space-y-1.5">
            <Label htmlFor="hero-description">
              Description<span className="text-[#C8151B]"> *</span>
            </Label>
            <Textarea
              id="hero-description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
              className={cn(errors.description && "border-red-400")}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-videoType">Vidéo de fond</Label>
              <Select value={form.videoType} onValueChange={(v) => set("videoType", v as HeroVideoTypeValue)}>
                <SelectTrigger id="hero-videoType" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HERO_VIDEO_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {HERO_VIDEO_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.videoType === "YOUTUBE" && (
              <div className="space-y-1.5">
                <Label htmlFor="hero-youtubeUrl">
                  Lien YouTube<span className="text-[#C8151B]"> *</span>
                </Label>
                <Input
                  id="hero-youtubeUrl"
                  value={form.youtubeUrl}
                  onChange={(e) => set("youtubeUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-invalid={youtubeInvalid || Boolean(errors.youtubeUrl)}
                  className={cn("bg-white", (youtubeInvalid || errors.youtubeUrl) && "border-red-400")}
                />
                <p className="text-xs text-zinc-500">
                  Chemin recommandé pour toute vidéo longue : rien n&apos;est stocké ni compressé de notre côté. {YOUTUBE_FORMATS_HINT}
                </p>
                {(youtubeInvalid || errors.youtubeUrl) && (
                  <p className="text-xs text-red-600">
                    {errors.youtubeUrl ?? `Lien YouTube invalide. ${YOUTUBE_FORMATS_HINT}`}
                  </p>
                )}
                {youtubeId && (
                  <div className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={youtubeThumbnailUrl(youtubeId, "hq")}
                      alt="Miniature de la vidéo YouTube"
                      className="aspect-video w-full max-w-xs rounded-md object-cover"
                    />
                    <p className="text-xs text-emerald-700">Vidéo reconnue : {youtubeId}</p>
                  </div>
                )}
              </div>
            )}

            {form.videoType === "MP4" && (
              <MediaUpload
                target={{ bucket: "hero", kind: "video" }}
                value={form.mp4Url}
                onChange={(url) => set("mp4Url", url)}
                onPoster={(url) => set("posterUrl", url)}
                label="Fichier vidéo"
                required
                hint="Boucle courte (10 à 30 s), compressée automatiquement ; la couverture est extraite toute seule. Pour une vidéo longue, préférez un lien YouTube."
                error={errors.mp4Url}
              />
            )}

            <MediaUpload
              target={{ bucket: "hero", kind: "poster" }}
              profile="hero-poster"
              value={form.posterUrl}
              onChange={(url) => set("posterUrl", url)}
              label="Image de couverture"
              required={form.videoType === "MP4"}
              hint={
                form.videoType === "MP4"
                  ? "Obligatoire pour une vidéo MP4 : remplie automatiquement à partir de la vidéo, remplaçable. 1920 x 1080 recommandé. Affichée immédiatement, avant la vidéo."
                  : form.videoType === "YOUTUBE"
                    ? "Optionnelle : remplace la miniature YouTube si elle est absente ou de mauvaise qualité. 1920 x 1080 recommandé."
                    : "Optionnelle : sans image, l'animation de scène s'affiche. 1920 x 1080 recommandé."
              }
              error={errors.posterUrl}
            />

            {form.videoType !== "NONE" &&
              field("soundLabel", "Libellé du bouton son", {
                placeholder: "Regarder avec le son",
              })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("cta1Label", "Bouton 1, libellé", { required: true })}
            {field("cta1Href", "Bouton 1, lien", { required: true, placeholder: "/contact" })}
            {field("cta2Label", "Bouton 2, libellé")}
            {field("cta2Href", "Bouton 2, lien", { placeholder: "/services" })}
          </div>
          {field("badgeText", "Badge (optionnel)", {
            placeholder: "Prochaine cohorte | Captation Live",
            hint: "Format Libellé | Texte : le libellé s'affiche dans la pastille rouge. Le jeton {prochaine-cohorte} affiche la prochaine cohorte ouverte (ex. « Prochaine cohorte | {prochaine-cohorte} » donne « Cohorte 9 · 7 janv. ») ; sans cohorte ouverte, le badge est masqué.",
          })}
          {form.badgeText.includes(NEXT_COHORT_TOKEN) && (
            <p role="status" className="-mt-2 text-xs text-zinc-600">
              {nextCohort ? (
                <>
                  Valeur actuelle : <strong className="text-zinc-900">{applyBadgeToken(form.badgeText, nextCohort)}</strong>
                </>
              ) : (
                "Valeur actuelle : aucune cohorte ouverte, le badge est masqué sur le site."
              )}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            <Button type="button" variant="outline" onClick={() => onPreview(draftView(form))}>
              <Eye className="mr-1.5 h-4 w-4" /> Prévisualiser
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
