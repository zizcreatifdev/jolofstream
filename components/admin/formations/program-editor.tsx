"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  PlusCircle,
  Trash2,
  Upload,
} from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextField } from "@/components/admin/parametres/content-fields"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import { SessionForm } from "@/components/admin/formations/session-form"
import { BADGE_STYLES } from "@/lib/badge-styles"
import {
  SESSION_STATUSES,
  formatPrice,
  formatSessionDate,
  type SessionStatus,
} from "@/lib/formations"
import { getBrowserSupabase } from "@/lib/supabase-browser"
import {
  BROCHURE_MAX_BYTES,
  MAX_CURRICULUM,
  MAX_CURRICULUM_CONTENT,
  MAX_DISCIPLINES,
  MAX_OBJECTIVES,
  MAX_STATS,
  brochurePublicPath,
  programInputSchema,
  type CurriculumItem,
  type StatItem,
} from "@/lib/training-programs"
import { cn } from "@/lib/utils"

export type ProgramData = {
  id: string
  slug: string
  code: string | null
  name: string
  tagline: string | null
  description: string | null
  disciplines: string[]
  sessionsCount: number | null
  theoryHours: number | null
  practiceHours: number | null
  level: string | null
  audience: string | null
  objectives: string[]
  curriculum: CurriculumItem[]
  stats: StatItem[]
  leadName: string | null
  leadRole: string | null
  contactEmail: string | null
  contactPhone: string | null
  defaultPrice: number | null
  defaultMaxSeats: number | null
  published: boolean
  brochureUrl: string | null
  brochureTitle: string | null
  brochureFileName: string | null
  brochureSize: number | null
  brochurePages: number | null
  brochureUpdatedAt: string | null
  brochurePublished: boolean
}

export type CohortRow = {
  id: string
  displayName: string
  label: string | null
  dateStart: string | null
  dateEnd: string | null
  scheduleText: string | null
  location: string
  status: string
  maxSeats: number
  price: number
  pending: number
  confirmed: number
  waitlist: number
  overdue: number
}

export type ProgramTestimonial = {
  id: string
  quote: string
  authorName: string
  authorRole: string | null
  published: boolean
}

const TABS = ["fiche", "plaquette", "cohortes", "temoignages"] as const

// Page programme : fiche, plaquette PDF, cohortes, temoignages
export function ProgramEditor({
  program,
  cohorts,
  testimonials,
  initialTab,
  siteUrl,
}: {
  program: ProgramData
  cohorts: CohortRow[]
  testimonials: ProgramTestimonial[]
  initialTab?: string
  siteUrl: string
}) {
  return (
    <Tabs defaultValue={TABS.includes(initialTab as (typeof TABS)[number]) ? initialTab : "fiche"}>
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="fiche">Fiche</TabsTrigger>
        <TabsTrigger value="plaquette">Plaquette</TabsTrigger>
        <TabsTrigger value="cohortes">Cohortes ({cohorts.length})</TabsTrigger>
        <TabsTrigger value="temoignages">Témoignages ({testimonials.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="fiche" className="mt-6">
        <FicheEditor program={program} hasCohorts={cohorts.length > 0} />
      </TabsContent>
      <TabsContent value="plaquette" className="mt-6">
        <BrochurePanel program={program} siteUrl={siteUrl} />
      </TabsContent>
      <TabsContent value="cohortes" className="mt-6">
        <CohortsPanel program={program} cohorts={cohorts} />
      </TabsContent>
      <TabsContent value="temoignages" className="mt-6">
        <TestimonialsPanel testimonials={testimonials} />
      </TabsContent>
    </Tabs>
  )
}

/* ------------------------------------------------------------------ */
/* Fiche                                                               */
/* ------------------------------------------------------------------ */

type Keyed<T> = { key: string; value: T }
let keySeq = 0
function keyed<T>(value: T): Keyed<T> {
  keySeq += 1
  return { key: `k${keySeq}`, value }
}

type CurriculumState = { title: string; mode: string; content: Keyed<string>[] }

type FicheState = {
  slug: string
  code: string
  name: string
  tagline: string
  description: string
  disciplines: Keyed<string>[]
  sessionsCount: string
  theoryHours: string
  practiceHours: string
  level: string
  audience: string
  objectives: Keyed<string>[]
  curriculum: Keyed<CurriculumState>[]
  stats: Keyed<StatItem>[]
  leadName: string
  leadRole: string
  contactEmail: string
  contactPhone: string
  defaultPrice: string
  defaultMaxSeats: string
  published: boolean
}

const str = (v: string | null | undefined) => v ?? ""
const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v))

function toFicheState(p: ProgramData): FicheState {
  return {
    slug: p.slug,
    code: str(p.code),
    name: p.name,
    tagline: str(p.tagline),
    description: str(p.description),
    disciplines: p.disciplines.map(keyed),
    sessionsCount: num(p.sessionsCount),
    theoryHours: num(p.theoryHours),
    practiceHours: num(p.practiceHours),
    level: str(p.level),
    audience: str(p.audience),
    objectives: p.objectives.map(keyed),
    curriculum: p.curriculum.map((c) =>
      keyed({ title: c.title, mode: c.mode, content: c.content.map(keyed) })
    ),
    stats: p.stats.map(keyed),
    leadName: str(p.leadName),
    leadRole: str(p.leadRole),
    contactEmail: str(p.contactEmail),
    contactPhone: str(p.contactPhone),
    defaultPrice: num(p.defaultPrice),
    defaultMaxSeats: num(p.defaultMaxSeats),
    published: p.published,
  }
}

function toPayload(s: FicheState) {
  return {
    slug: s.slug.trim(),
    code: s.code,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    disciplines: s.disciplines.map((d) => d.value),
    sessionsCount: s.sessionsCount,
    theoryHours: s.theoryHours,
    practiceHours: s.practiceHours,
    level: s.level,
    audience: s.audience,
    objectives: s.objectives.map((o) => o.value),
    curriculum: s.curriculum.map((c) => ({
      title: c.value.title,
      mode: c.value.mode,
      content: c.value.content.map((x) => x.value),
    })),
    stats: s.stats.map((x) => x.value),
    leadName: s.leadName,
    leadRole: s.leadRole,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    defaultPrice: s.defaultPrice,
    defaultMaxSeats: s.defaultMaxSeats,
    published: s.published,
  }
}

function FicheEditor({ program, hasCohorts }: { program: ProgramData; hasCohorts: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<FicheState>(() => toFicheState(program))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; error: boolean } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const set = <K extends keyof FicheState>(key: K, value: FicheState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))
  const text = (key: keyof FicheState) => (v: string) => set(key, v as never)

  const save = async () => {
    setStatus(null)
    const payload = toPayload(form)
    const parsed = programInputSchema.safeParse(payload)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".")
        if (!next[path]) next[path] = issue.message
      }
      setErrors(next)
      setStatus({ message: "Corrigez les champs signalés.", error: true })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const r = await fetch(`/api/formations/programmes/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        if (data?.issues && typeof data.issues === "object") {
          const next: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.issues as Record<string, string[]>)) {
            if (v?.[0]) next[k] = v[0]
          }
          setErrors(next)
        }
        setStatus({ message: (data && data.error) || "Enregistrement impossible.", error: true })
        return
      }
      setStatus({ message: "Fiche enregistrée.", error: false })
      router.refresh()
    } catch {
      setStatus({ message: "Connexion impossible.", error: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <FicheSection
        title="Identité"
        where="Nom et accroche : en-tête de la fiche publique du programme et cartes Formations. L'adresse sert aussi au lien de la plaquette."
      >
        <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-4 py-3">
          <div>
            <Label htmlFor="pg-published" className="text-sm font-medium text-zinc-900">
              Programme publié
            </Label>
            <p className="text-xs text-zinc-500">
              Masqué : la fiche et la plaquette ne sont plus accessibles au public.
            </p>
          </div>
          <Switch
            id="pg-published"
            checked={form.published}
            onCheckedChange={(v) => set("published", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <TextField id="pg-name" label="Nom" required value={form.name} onChange={text("name")} error={errors.name} max={120} />
          <TextField id="pg-code" label="Code" value={form.code} onChange={text("code")} error={errors.code} max={20} placeholder="F-RMPD" />
        </div>
        <TextField
          id="pg-slug"
          label="Adresse"
          required
          value={form.slug}
          onChange={text("slug")}
          error={errors.slug}
          max={80}
          hint={`jolofstream.com/formations/${form.slug || "..."} (minuscules, chiffres et tirets). La changer casse les liens déjà partagés.`}
        />
        <TextField id="pg-tagline" label="Accroche" value={form.tagline} onChange={text("tagline")} error={errors.tagline} max={120} />
        <TextField
          id="pg-description"
          label="Description"
          value={form.description}
          onChange={text("description")}
          error={errors.description}
          max={800}
          multiline
          rows={5}
        />
      </FicheSection>

      <FicheSection title="Format" where="Bloc « En bref » de la fiche publique : disciplines, volume horaire, niveau et public.">
        <StringListEditor
          id="pg-disciplines"
          label="Disciplines"
          itemLabel="la discipline"
          items={form.disciplines}
          onChange={(disciplines) => set("disciplines", disciplines)}
          max={MAX_DISCIPLINES}
          itemMax={60}
          errors={errors}
          errorPrefix="disciplines"
          addLabel="Ajouter une discipline"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField id="pg-sessions" label="Nombre de séances" value={form.sessionsCount} onChange={text("sessionsCount")} error={errors.sessionsCount} />
          <NumberField id="pg-theory" label="Heures de théorie" value={form.theoryHours} onChange={text("theoryHours")} error={errors.theoryHours} />
          <NumberField id="pg-practice" label="Heures de pratique" value={form.practiceHours} onChange={text("practiceHours")} error={errors.practiceHours} />
        </div>
        <TextField id="pg-level" label="Niveau" value={form.level} onChange={text("level")} error={errors.level} max={80} placeholder="Aucun prérequis" />
        <TextField id="pg-audience" label="Public" value={form.audience} onChange={text("audience")} error={errors.audience} max={300} multiline />
      </FicheSection>

      <FicheSection title="Objectifs" where="Liste « Ce que vous saurez faire » de la fiche publique.">
        <StringListEditor
          id="pg-objectives"
          label="Objectifs"
          itemLabel="l'objectif"
          items={form.objectives}
          onChange={(objectives) => set("objectives", objectives)}
          max={MAX_OBJECTIVES}
          itemMax={200}
          errors={errors}
          errorPrefix="objectives"
          addLabel="Ajouter un objectif"
        />
      </FicheSection>

      <FicheSection title="Programme séance par séance" where="Déroulé de la fiche publique : une entrée par séance, avec son format et son contenu.">
        <CurriculumEditor items={form.curriculum} onChange={(curriculum) => set("curriculum", curriculum)} errors={errors} />
      </FicheSection>

      <FicheSection title="Chiffres clés" where="Bandeau de chiffres de la fiche publique (4 au plus).">
        <StatsEditor items={form.stats} onChange={(stats) => set("stats", stats)} errors={errors} />
      </FicheSection>

      <FicheSection title="Responsable et contact" where="Encadré « Votre formateur » et contact de la fiche publique.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="pg-lead-name" label="Responsable" value={form.leadName} onChange={text("leadName")} error={errors.leadName} max={80} />
          <TextField id="pg-lead-role" label="Rôle du responsable" value={form.leadRole} onChange={text("leadRole")} error={errors.leadRole} max={120} />
          <TextField id="pg-email" label="Email de contact" value={form.contactEmail} onChange={text("contactEmail")} error={errors.contactEmail} />
          <TextField id="pg-phone" label="Téléphone de contact" value={form.contactPhone} onChange={text("contactPhone")} error={errors.contactPhone} max={30} />
        </div>
      </FicheSection>

      <FicheSection title="Valeurs par défaut des cohortes" where="Préremplissent le prix et le nombre de places d'une nouvelle cohorte. Non affichées sur le site.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField id="pg-price" label="Prix par défaut (FCFA)" value={form.defaultPrice} onChange={text("defaultPrice")} error={errors.defaultPrice} />
          <NumberField id="pg-seats" label="Places par défaut" value={form.defaultMaxSeats} onChange={text("defaultMaxSeats")} error={errors.defaultMaxSeats} />
        </div>
      </FicheSection>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="border-red-200 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer le programme
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {status && (
            <p role="status" className={cn("text-sm", status.error ? "text-red-600" : "text-emerald-600")}>
              {status.message}
            </p>
          )}
          <Button type="submit" disabled={saving} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? "Enregistrement..." : "Enregistrer la fiche"}
          </Button>
        </div>
      </div>

      <DeleteProgramDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        program={program}
        hasCohorts={hasCohorts}
      />
    </form>
  )
}

function FicheSection({ title, where, children }: { title: string; where: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="border-b border-zinc-100 pb-3">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">Où cela apparaît : {where}</p>
      </div>
      {children}
    </section>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(error && "border-red-400")}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      onClick={onClick}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

function StringListEditor({
  id,
  label,
  itemLabel,
  items,
  onChange,
  max,
  itemMax,
  errors,
  errorPrefix,
  addLabel,
}: {
  id: string
  label: string
  itemLabel: string
  items: Keyed<string>[]
  onChange: (items: Keyed<string>[]) => void
  max: number
  itemMax: number
  errors: Record<string, string>
  errorPrefix: string
  addLabel: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-700">
        {label} ({items.length} / {max})
      </p>
      {items.length > 0 && (
        <SortableList
          label={label}
          itemLabel={itemLabel}
          items={items}
          getKey={(item) => item.key}
          onMove={(from, to) => onChange(moveItem(items, from, to))}
          actions={(_, i) => (
            <RemoveButton
              label={`Supprimer ${itemLabel} ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            />
          )}
          renderItem={(item, i) => (
            <TextField
              id={`${id}-${i}`}
              label={`${label.replace(/s$/, "")} ${i + 1}`}
              value={item.value}
              onChange={(value) => onChange(items.map((it, j) => (j === i ? { ...it, value } : it)))}
              error={errors[`${errorPrefix}.${i}`]}
              max={itemMax}
            />
          )}
        />
      )}
      {errors[errorPrefix] && <p className="text-xs text-red-600">{errors[errorPrefix]}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= max}
        onClick={() => onChange([...items, keyed("")])}
      >
        <PlusCircle className="mr-1.5 h-4 w-4" /> {addLabel}
      </Button>
    </div>
  )
}

function CurriculumEditor({
  items,
  onChange,
  errors,
}: {
  items: Keyed<CurriculumState>[]
  onChange: (items: Keyed<CurriculumState>[]) => void
  errors: Record<string, string>
}) {
  const update = (index: number, patch: Partial<CurriculumState>) =>
    onChange(items.map((it, j) => (j === index ? { ...it, value: { ...it.value, ...patch } } : it)))
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-700">
        Séances ({items.length} / {MAX_CURRICULUM})
      </p>
      {items.length > 0 && (
        <SortableList
          label="Séances"
          itemLabel="la séance"
          items={items}
          getKey={(item) => item.key}
          onMove={(from, to) => onChange(moveItem(items, from, to))}
          actions={(_, i) => (
            <RemoveButton
              label={`Supprimer la séance ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            />
          )}
          renderItem={(item, i) => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
                <TextField
                  id={`pg-cur-${i}-title`}
                  label="Titre de la séance"
                  required
                  value={item.value.title}
                  onChange={(title) => update(i, { title })}
                  error={errors[`curriculum.${i}.title`]}
                  max={120}
                />
                <TextField
                  id={`pg-cur-${i}-mode`}
                  label="Format"
                  value={item.value.mode}
                  onChange={(mode) => update(i, { mode })}
                  error={errors[`curriculum.${i}.mode`]}
                  max={80}
                  placeholder="Atelier pratique"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-600">
                  Contenu ({item.value.content.length} / {MAX_CURRICULUM_CONTENT})
                </p>
                {item.value.content.map((c, k) => (
                  <div key={c.key} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <TextField
                        id={`pg-cur-${i}-content-${k}`}
                        label={`Point ${k + 1}`}
                        value={c.value}
                        onChange={(value) =>
                          update(i, {
                            content: item.value.content.map((x, m) => (m === k ? { ...x, value } : x)),
                          })
                        }
                        error={errors[`curriculum.${i}.content.${k}`]}
                        max={240}
                      />
                    </div>
                    <div className="pt-6">
                      <RemoveButton
                        label={`Supprimer le point ${k + 1} de la séance ${i + 1}`}
                        onClick={() => update(i, { content: item.value.content.filter((_, m) => m !== k) })}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={item.value.content.length >= MAX_CURRICULUM_CONTENT}
                  onClick={() => update(i, { content: [...item.value.content, keyed("")] })}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter un point
                </Button>
              </div>
            </div>
          )}
        />
      )}
      {errors.curriculum && <p className="text-xs text-red-600">{errors.curriculum}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= MAX_CURRICULUM}
        onClick={() => onChange([...items, keyed({ title: "", mode: "", content: [] })])}
      >
        <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter une séance
      </Button>
    </div>
  )
}

function StatsEditor({
  items,
  onChange,
  errors,
}: {
  items: Keyed<StatItem>[]
  onChange: (items: Keyed<StatItem>[]) => void
  errors: Record<string, string>
}) {
  const update = (index: number, patch: Partial<StatItem>) =>
    onChange(items.map((it, j) => (j === index ? { ...it, value: { ...it.value, ...patch } } : it)))
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-700">
        Chiffres ({items.length} / {MAX_STATS})
      </p>
      {items.length > 0 && (
        <SortableList
          label="Chiffres clés"
          itemLabel="le chiffre"
          items={items}
          getKey={(item) => item.key}
          onMove={(from, to) => onChange(moveItem(items, from, to))}
          actions={(_, i) => (
            <RemoveButton
              label={`Supprimer le chiffre ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            />
          )}
          renderItem={(item, i) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_3fr]">
              <TextField
                id={`pg-stat-${i}-value`}
                label="Valeur"
                required
                value={item.value.value}
                onChange={(value) => update(i, { value })}
                error={errors[`stats.${i}.value`]}
                max={12}
                placeholder="90"
              />
              <TextField
                id={`pg-stat-${i}-label`}
                label="Libellé"
                required
                value={item.value.label}
                onChange={(label) => update(i, { label })}
                error={errors[`stats.${i}.label`]}
                max={80}
                placeholder="personnes formées"
              />
            </div>
          )}
        />
      )}
      {errors.stats && <p className="text-xs text-red-600">{errors.stats}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= MAX_STATS}
        onClick={() => onChange([...items, keyed({ value: "", label: "" })])}
      >
        <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter un chiffre
      </Button>
    </div>
  )
}

function DeleteProgramDialog({
  open,
  onOpenChange,
  program,
  hasCohorts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: ProgramData
  hasCohorts: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/formations/programmes/${program.id}`, { method: "DELETE" })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        setError((data && data.error) || "Suppression impossible.")
        return
      }
      onOpenChange(false)
      router.push("/admin/formations")
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setError(null)
          onOpenChange(v)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le programme ?</DialogTitle>
          <DialogDescription>
            {hasCohorts
              ? "Ce programme a des cohortes : la suppression sera refusée. Masquez-le plutôt (interrupteur « Programme publié »)."
              : `${program.name} et sa plaquette seront supprimés. Cette action est définitive.`}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {busy ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Plaquette                                                           */
/* ------------------------------------------------------------------ */

function formatSize(bytes: number | null): string {
  if (!bytes) return "-"
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
}

function formatDay(value: string | null): string {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value))
}

function BrochurePanel({ program, siteUrl }: { program: ProgramData; siteUrl: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [info, setInfo] = useState({
    url: program.brochureUrl,
    size: program.brochureSize,
    updatedAt: program.brochureUpdatedAt,
    published: program.brochurePublished,
  })
  const [meta, setMeta] = useState({
    title: str(program.brochureTitle),
    fileName: str(program.brochureFileName),
    pages: num(program.brochurePages),
  })
  const [busy, setBusy] = useState<null | "upload" | "meta" | "publish" | "remove">(null)
  const [status, setStatus] = useState<{ message: string; error: boolean } | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const path = brochurePublicPath(program.slug)
  const publicLink = `${siteUrl}${path}`
  const displayLink = publicLink.replace(/^https?:\/\//, "")
  const metaPayload = {
    brochureTitle: meta.title,
    brochureFileName: meta.fileName,
    brochurePages: meta.pages,
  }

  const applyResponse = (data: Partial<ProgramData>) => {
    setInfo({
      url: data.brochureUrl ?? null,
      size: data.brochureSize ?? null,
      updatedAt: data.brochureUpdatedAt ?? null,
      published: Boolean(data.brochurePublished),
    })
    setMeta({
      title: str(data.brochureTitle),
      fileName: str(data.brochureFileName),
      pages: num(data.brochurePages),
    })
  }

  const errorOf = (data: unknown, fallback: string) => {
    const d = data as { error?: string; issues?: Record<string, string[]> } | null
    const issue = d?.issues ? Object.values(d.issues)[0]?.[0] : null
    return issue || d?.error || fallback
  }

  const upload = async (file: File) => {
    setStatus(null)
    if (file.type !== "application/pdf") {
      setStatus({ message: "Format non accepté : PDF uniquement.", error: true })
      return
    }
    if (file.size > BROCHURE_MAX_BYTES) {
      setStatus({ message: `Fichier trop lourd (${formatSize(file.size)}). 10 Mo maximum.`, error: true })
      return
    }
    setBusy("upload")
    try {
      const sign = await fetch("/api/storage/signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: "formations",
          kind: "brochure",
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })
      const signed = await sign.json().catch(() => null)
      if (!sign.ok || !signed?.token) {
        setStatus({ message: errorOf(signed, "Téléversement impossible."), error: true })
        return
      }
      const { error: uploadError } = await getBrowserSupabase()
        .storage.from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: "application/pdf" })
      if (uploadError) {
        setStatus({ message: `Échec du téléversement : ${uploadError.message}`, error: true })
        return
      }
      const r = await fetch(`/api/formations/programmes/${program.id}/plaquette`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: signed.path, ...metaPayload }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        setStatus({ message: errorOf(data, "Plaquette refusée."), error: true })
        return
      }
      applyResponse(data)
      setStatus({ message: info.url ? "Plaquette remplacée." : "Plaquette ajoutée.", error: false })
      router.refresh()
    } catch {
      setStatus({ message: "Connexion impossible. Réessayez.", error: true })
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const patch = async (published: boolean, kind: "meta" | "publish") => {
    setStatus(null)
    setBusy(kind)
    try {
      const r = await fetch(`/api/formations/programmes/${program.id}/plaquette`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metaPayload, brochurePublished: published }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        setStatus({ message: errorOf(data, "Enregistrement impossible."), error: true })
        return
      }
      applyResponse(data)
      setStatus({
        message:
          kind === "publish"
            ? published
              ? "Plaquette publiée : le lien public est actif."
              : "Plaquette dépubliée : le lien public renvoie une page introuvable."
            : "Informations enregistrées.",
        error: false,
      })
      router.refresh()
    } catch {
      setStatus({ message: "Connexion impossible.", error: true })
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy("remove")
    setStatus(null)
    try {
      const r = await fetch(`/api/formations/programmes/${program.id}/plaquette`, { method: "DELETE" })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        setStatus({ message: errorOf(data, "Retrait impossible."), error: true })
        return
      }
      applyResponse(data)
      setRemoveOpen(false)
      setStatus({ message: "Plaquette retirée.", error: false })
      router.refresh()
    } catch {
      setStatus({ message: "Connexion impossible.", error: true })
    } finally {
      setBusy(null)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setStatus({ message: "Copie impossible : sélectionnez le lien à la main.", error: true })
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="border-b border-zinc-100 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">Fichier PDF</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Où cela apparaît : bouton « Télécharger la plaquette » de la fiche publique et lien dans
            l&apos;email d&apos;inscription, une fois publiée. PDF, 10 Mo maximum.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
            <FileText className="h-7 w-7" aria-hidden="true" />
          </span>
          {info.url ? (
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-zinc-500">Taille</dt>
                <dd className="font-medium text-zinc-900">{formatSize(info.size)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Pages</dt>
                <dd className="font-medium text-zinc-900">{meta.pages || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Mise à jour</dt>
                <dd className="font-medium text-zinc-900">{formatDay(info.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Statut</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      info.published ? BADGE_STYLES.active : BADGE_STYLES.draft
                    )}
                  >
                    {info.published ? "Publiée" : "Non publiée"}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="flex-1 text-sm text-zinc-500">Aucune plaquette pour ce programme.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="brochure-file"
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file)
            }}
          />
          <Button type="button" variant="outline" disabled={busy !== null} onClick={() => inputRef.current?.click()}>
            {busy === "upload" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            {busy === "upload" ? "Vérification..." : info.url ? "Remplacer" : "Téléverser un PDF"}
          </Button>
          {info.url && (
            <>
              <Button asChild variant="outline">
                <a href={info.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ouvrir le PDF
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={() => setRemoveOpen(true)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Retirer
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-4 py-3">
          <div>
            <Label htmlFor="brochure-published" className="text-sm font-medium text-zinc-900">
              Publier la plaquette
            </Label>
            <p className="text-xs text-zinc-500">
              {program.published
                ? "Rend le lien public actif."
                : "Le programme est masqué : le lien restera introuvable tant qu'il n'est pas publié."}
            </p>
          </div>
          <Switch
            id="brochure-published"
            checked={info.published}
            disabled={!info.url || busy !== null}
            onCheckedChange={(v) => void patch(v, "publish")}
          />
        </div>

        {status && (
          <p role="status" className={cn("text-sm", status.error ? "text-red-600" : "text-emerald-600")}>
            {status.message}
          </p>
        )}
      </section>

      <form
        noValidate
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault()
          void patch(info.published, "meta")
        }}
      >
        <div className="border-b border-zinc-100 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">Informations</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Où cela apparaît : titre du bouton de téléchargement et nom du fichier enregistré sur le
            téléphone ou l&apos;ordinateur du visiteur.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_2fr_1fr]">
          <TextField
            id="brochure-title"
            label="Titre"
            value={meta.title}
            onChange={(title) => setMeta((m) => ({ ...m, title }))}
            max={120}
          />
          <TextField
            id="brochure-filename"
            label="Nom du fichier téléchargé"
            value={meta.fileName}
            onChange={(fileName) => setMeta((m) => ({ ...m, fileName }))}
            placeholder="Jolof-Stream-Formation.pdf"
            hint="En .pdf, sans espace ni accent."
          />
          <NumberField
            id="brochure-pages"
            label="Pages"
            value={meta.pages}
            onChange={(pages) => setMeta((m) => ({ ...m, pages }))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy !== null} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
            {busy === "meta" ? "Enregistrement..." : "Enregistrer les informations"}
          </Button>
        </div>
      </form>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Lien public stable</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Ce lien ne change pas quand vous remplacez le fichier : partagez-le sur WhatsApp ou les
            réseaux. Il télécharge le PDF ; ajoutez ?mode=view pour l&apos;afficher dans le navigateur.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
            {displayLink}
          </code>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void copy()}>
              <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" /> {copied ? "Copié" : "Copier"}
            </Button>
            <Button asChild variant="outline">
              <a href={path} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" /> Tester
              </a>
            </Button>
          </div>
        </div>
        {(!info.url || !info.published || !program.published) && (
          <p className="text-xs text-amber-700">
            Lien inactif pour le moment :{" "}
            {!info.url
              ? "aucun PDF téléversé."
              : !info.published
                ? "plaquette non publiée."
                : "programme masqué."}
          </p>
        )}
      </section>

      <Dialog open={removeOpen} onOpenChange={(v) => busy !== "remove" && setRemoveOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer la plaquette ?</DialogTitle>
            <DialogDescription>
              Le fichier PDF est supprimé et la plaquette dépubliée : le lien public renverra une page
              introuvable. Le titre et le nom du fichier sont conservés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)} disabled={busy === "remove"}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void remove()}
              disabled={busy === "remove"}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy === "remove" ? "Retrait..." : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cohortes                                                            */
/* ------------------------------------------------------------------ */

function CohortsPanel({ program, cohorts }: { program: ProgramData; cohorts: CohortRow[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {program.defaultPrice || program.defaultMaxSeats
            ? `Nouvelle cohorte préremplie : ${program.defaultPrice ? formatPrice(program.defaultPrice) : "prix à saisir"}, ${program.defaultMaxSeats ? `${program.defaultMaxSeats} places` : "places à saisir"} (fiche du programme).`
            : "Aucun prix ni nombre de places par défaut : renseignez-les dans la fiche pour préremplir les nouvelles cohortes."}
        </p>
        <Button onClick={() => setFormOpen(true)} className="bg-[#C8151B] text-white hover:bg-[#a01015]">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Nouvelle cohorte
        </Button>
      </div>

      {cohorts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
          Aucune cohorte pour ce programme.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {cohorts.map((c) => {
            const status = SESSION_STATUSES[c.status as SessionStatus] ?? SESSION_STATUSES.ouvert
            const occupied = c.pending + c.confirmed
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/formations/${c.id}`}
                  className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900">{c.displayName}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                        {status.label}
                      </span>
                      {c.overdue > 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          {c.overdue} hors délai
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {c.dateStart ? formatSessionDate(c.dateStart, c.dateEnd) : c.scheduleText || "Dates à venir"}
                      {" · "}
                      {c.location} · {formatPrice(c.price)}
                    </p>
                  </div>
                  <dl className="grid grid-cols-4 gap-2 text-center text-sm lg:w-[400px]">
                    <CohortFigure label="Places" value={`${occupied} / ${c.maxSeats}`} />
                    <CohortFigure label="Confirmés" value={String(c.confirmed)} />
                    <CohortFigure label="Attente" value={String(c.pending)} />
                    <CohortFigure label="Liste" value={String(c.waitlist)} />
                  </dl>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <SessionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        programId={program.id}
        programName={program.name}
        initial={{
          location: "Dakar",
          price: program.defaultPrice ?? undefined,
          maxSeats: program.defaultMaxSeats ?? undefined,
          status: "ouvert",
        }}
        onSaved={(id) => {
          if (id) router.push(`/admin/formations/${id}`)
          else router.refresh()
        }}
      />
    </div>
  )
}

function CohortFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-2 py-1.5">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="font-semibold text-zinc-900">{value}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Temoignages (lecture seule)                                         */
/* ------------------------------------------------------------------ */

function TestimonialsPanel({ testimonials }: { testimonials: ProgramTestimonial[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Parcours d&apos;anciens rattachés à ce programme. Création, modification et ordre :
          Paramètres &gt; Contenu du site &gt; Témoignages (contexte Formation).
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/parametres?section=content&onglet=temoignages">Gérer les témoignages</Link>
        </Button>
      </div>
      {testimonials.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
          Aucun témoignage rattaché à ce programme.
        </div>
      ) : (
        <ul className="space-y-2">
          {testimonials.map((t) => (
            <li key={t.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">{t.authorName}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    t.published ? BADGE_STYLES.active : BADGE_STYLES.draft
                  )}
                >
                  {t.published ? "Publié" : "Brouillon"}
                </span>
              </div>
              {t.authorRole && <p className="text-xs text-zinc-500">{t.authorRole}</p>}
              <p className="mt-1 text-sm text-zinc-600">{t.quote}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
