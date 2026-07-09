"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  GraduationCap,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type EvenementType = "projet" | "formation" | "tache" | "evenement_manuel"

type Evenement = {
  id: string
  title: string
  date: string
  type: EvenementType
  subtype: string
  status: string
  clientName?: string
  url: string
  color: string
  manualId?: string
  createdBy?: string
  notes?: string
}

const TYPE_ICONS: Record<EvenementType, typeof FolderKanban> = {
  projet: FolderKanban,
  formation: GraduationCap,
  tache: CheckSquare,
  evenement_manuel: Sparkles,
}

const TYPE_LABELS: Record<EvenementType, string> = {
  projet: "Projet",
  formation: "Formation",
  tache: "Tache",
  evenement_manuel: "Evenement",
}

const MANUAL_TYPE_OPTIONS = [
  { value: "evenement", label: "Evenement" },
  { value: "reunion", label: "Reunion" },
  { value: "rappel", label: "Rappel" },
  { value: "conge", label: "Conge" },
  { value: "autre", label: "Autre" },
] as const

const MANUAL_TYPE_LABEL: Record<string, string> = {
  evenement: "Evenement",
  reunion: "Reunion",
  rappel: "Rappel",
  conge: "Conge",
  autre: "Autre",
}

const MOIS_LABELS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
]

const JOURS_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  // Lundi = debut de semaine
  const out = new Date(d)
  const dow = (out.getDay() + 6) % 7
  out.setDate(out.getDate() - dow)
  out.setHours(0, 0, 0, 0)
  return out
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type NewEventForm = {
  title: string
  date: string
  timeStart: string
  timeEnd: string
  type: (typeof MANUAL_TYPE_OPTIONS)[number]["value"]
  notes: string
}

function emptyForm(defaultDate: string): NewEventForm {
  return {
    title: "",
    date: defaultDate,
    timeStart: "",
    timeEnd: "",
    type: "evenement",
    notes: "",
  }
}

export function CalendrierView() {
  const { data: sessionData } = useSession()
  const currentUserId = sessionData?.user?.id ?? null

  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [vue, setVue] = useState<"mois" | "semaine">("mois")
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const [newEventOpen, setNewEventOpen] = useState(false)
  const [form, setForm] = useState<NewEventForm>(() =>
    emptyForm(toDateInput(new Date()))
  )
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Evenement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const year = cursor.getFullYear()
      const month = cursor.getMonth() + 1
      // En vue semaine, on charge le mois autour de la semaine courante
      const params = new URLSearchParams()
      params.set("year", String(year))
      params.set("month", String(month))
      const r = await fetch(`/api/calendrier?${params}`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as { evenements: Evenement[] }
      setEvenements(data.evenements)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
      setEvenements([])
    } finally {
      setLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    load()
  }, [load])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Evenement[]>()
    for (const e of evenements) {
      const k = dayKey(new Date(e.date))
      const arr = map.get(k) ?? []
      arr.push(e)
      map.set(k, arr)
    }
    return map
  }, [evenements])

  const prev = () => {
    if (vue === "mois") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
    } else {
      const d = new Date(cursor)
      d.setDate(d.getDate() - 7)
      setCursor(d)
    }
  }

  const next = () => {
    if (vue === "mois") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
    } else {
      const d = new Date(cursor)
      d.setDate(d.getDate() + 7)
      setCursor(d)
    }
  }

  const goToday = () => {
    const t = new Date()
    if (vue === "mois") {
      setCursor(new Date(t.getFullYear(), t.getMonth(), 1))
    } else {
      setCursor(startOfWeek(t))
    }
  }

  const openNewEvent = (date: Date | null) => {
    const iso = toDateInput(date ?? new Date())
    setForm(emptyForm(iso))
    setFormError(null)
    setNewEventOpen(true)
  }

  const submitNewEvent = async () => {
    if (!form.title.trim()) {
      setFormError("Titre requis.")
      return
    }
    if (!form.date) {
      setFormError("Date requise.")
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const dateIso = form.timeStart
        ? `${form.date}T${form.timeStart}`
        : `${form.date}T00:00`
      const endIso = form.timeEnd
        ? `${form.date}T${form.timeEnd}`
        : undefined
      const r = await fetch("/api/calendrier/evenements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          date: dateIso,
          endDate: endIso,
          type: form.type,
          notes: form.notes.trim() || undefined,
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setFormError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement."
        )
        return
      }
      setNewEventOpen(false)
      await load()
    } catch {
      setFormError("Connexion impossible.")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.manualId) return
    setDeleting(true)
    try {
      const r = await fetch(
        `/api/calendrier/evenements/${deleteTarget.manualId}`,
        { method: "DELETE" }
      )
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
        return
      }
      setDeleteTarget(null)
      setSelectedDay(null)
      await load()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const headerLabel = useMemo(() => {
    if (vue === "mois") {
      return `${MOIS_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`
    }
    const start = startOfWeek(cursor)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    return `Semaine du ${fmt(start)} au ${fmt(end)} ${end.getFullYear()}`
  }, [cursor, vue])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Aujourd&apos;hui
          </Button>
          <Button variant="outline" size="sm" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-base font-semibold text-zinc-900">
            {headerLabel}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setVue("mois")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                vue === "mois"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setVue("semaine")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                vue === "semaine"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              Semaine
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => openNewEvent(null)}
            className="bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvel evenement
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-[480px] w-full rounded-xl" />
      ) : vue === "mois" ? (
        <MoisView
          cursor={cursor}
          today={today}
          eventsByDay={eventsByDay}
          onDaySelect={setSelectedDay}
        />
      ) : (
        <SemaineView
          cursor={cursor}
          today={today}
          eventsByDay={eventsByDay}
        />
      )}

      <Sheet
        open={selectedDay !== null}
        onOpenChange={(v) => !v && setSelectedDay(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="border-b border-zinc-200 pb-4">
            <SheetTitle>
              {selectedDay
                ? new Intl.DateTimeFormat("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(selectedDay)
                : "Detail du jour"}
            </SheetTitle>
            <SheetDescription>
              Evenements et echeances du jour.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2 py-4">
            {selectedDay &&
            (eventsByDay.get(dayKey(selectedDay)) ?? []).length > 0 ? (
              (eventsByDay.get(dayKey(selectedDay)) ?? []).map((e) => (
                <EventItem
                  key={e.id}
                  event={e}
                  large
                  canDelete={
                    e.type === "evenement_manuel" &&
                    !!currentUserId &&
                    e.createdBy === currentUserId
                  }
                  onDelete={() => setDeleteTarget(e)}
                />
              ))
            ) : (
              <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
                Aucun evenement ce jour.
              </p>
            )}
          </div>
          <div className="border-t border-zinc-200 pt-4">
            <Button
              onClick={() => selectedDay && openNewEvent(selectedDay)}
              className="w-full bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter un evenement ce jour
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600 md:flex-row md:flex-wrap md:items-start md:gap-6">
        <LegendGroup title="Projets">
          <LegendDot color="#C8151B" label="Streaming Live / Captation" />
          <LegendDot color="#8B5CF6" label="CEO Content" />
          <LegendDot color="#F5B800" label="Creator Weekend" />
          <LegendDot color="#0891B2" label="Gestion reseaux" />
          <LegendDot color="#6B7280" label="Autre" />
        </LegendGroup>
        <LegendGroup title="Formations">
          <LegendDot color="#059669" label="Formation (cohorte impaire)" />
          <LegendDot color="#34D399" label="Formation (cohorte paire)" />
        </LegendGroup>
        <LegendGroup title="Evenements manuels">
          <LegendDot color="#EA580C" label="Evenement" />
          <LegendDot color="#3B82F6" label="Reunion" />
          <LegendDot color="#DB2777" label="Rappel" />
          <LegendDot color="#9CA3AF" label="Conge / Autre" />
        </LegendGroup>
        <LegendGroup title="Taches">
          <LegendDot color="#4F46E5" label="Tache a faire" />
          <LegendDot color="#EF4444" label="Tache en retard" />
        </LegendGroup>
      </div>

      <NewEventSheet
        open={newEventOpen}
        onOpenChange={setNewEventOpen}
        form={form}
        setForm={setForm}
        onSubmit={submitNewEvent}
        submitting={submitting}
        error={formError}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet evenement ?</DialogTitle>
            <DialogDescription>
              Action definitive. L&apos;evenement disparaitra du calendrier
              partage.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.title}</span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewEventSheet({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: NewEventForm
  setForm: (updater: (prev: NewEventForm) => NewEventForm) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>Nouvel evenement</SheetTitle>
          <SheetDescription>
            Ajouter un evenement partage sur le calendrier.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="flex flex-1 flex-col gap-4 py-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Titre *</Label>
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex : Reunion equipe hebdo"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Date *</Label>
            <Input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Heure debut</Label>
              <Input
                id="ev-start"
                type="time"
                value={form.timeStart}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeStart: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">Heure fin</Label>
              <Input
                id="ev-end"
                type="time"
                value={form.timeEnd}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeEnd: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  type: v as NewEventForm["type"],
                }))
              }
            >
              <SelectTrigger id="ev-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-zinc-500">
            La couleur est determinee automatiquement selon le type
            d&apos;evenement.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea
              id="ev-notes"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Informations complementaires..."
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {submitting ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function MoisView({
  cursor,
  today,
  eventsByDay,
  onDaySelect,
}: {
  cursor: Date
  today: Date
  eventsByDay: Map<string, Evenement[]>
  onDaySelect: (d: Date) => void
}) {
  // Premier jour du mois aligné sur lundi
  const firstDow = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7
  const gridStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  gridStart.setDate(gridStart.getDate() - firstDow)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    cells.push(d)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {JOURS_LABELS.map((j) => (
          <div key={j} className="px-2 py-2 text-center">
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isCurrentMonth = d.getMonth() === cursor.getMonth()
          const isToday = sameDay(d, today)
          const events = eventsByDay.get(dayKey(d)) ?? []
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDaySelect(d)}
              className={cn(
                "min-h-[88px] border-b border-r border-zinc-100 p-1.5 text-left transition-colors hover:bg-zinc-50",
                !isCurrentMonth && "bg-zinc-50/50",
                (i + 1) % 7 === 0 && "border-r-0"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday
                      ? "bg-[#C8151B] font-bold text-white"
                      : isCurrentMonth
                        ? "text-zinc-700"
                        : "text-zinc-300"
                  )}
                >
                  {d.getDate()}
                </span>
                {events.length > 0 && (
                  <span className="text-[10px] font-medium text-zinc-500">
                    {events.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 2).map((e) => (
                  <EventPill key={e.id} event={e} />
                ))}
                {events.length > 2 && (
                  <p className="text-[10px] text-zinc-500">
                    +{events.length - 2} autre
                    {events.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SemaineView({
  cursor,
  today,
  eventsByDay,
}: {
  cursor: Date
  today: Date
  eventsByDay: Map<string, Evenement[]>
}) {
  const start = startOfWeek(cursor)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-7 gap-px bg-zinc-100">
        {days.map((d) => {
          const events = eventsByDay.get(dayKey(d)) ?? []
          const isToday = sameDay(d, today)
          return (
            <div key={d.toISOString()} className="bg-white">
              <div
                className={cn(
                  "border-b border-zinc-200 px-3 py-2",
                  isToday && "bg-red-50"
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {JOURS_LABELS[(d.getDay() + 6) % 7]}
                </p>
                <p
                  className={cn(
                    "text-base font-bold",
                    isToday ? "text-[#C8151B]" : "text-zinc-900"
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
              <div className="min-h-[280px] space-y-1.5 px-2 py-2">
                {events.length === 0 ? (
                  <p className="pt-4 text-center text-[10px] text-zinc-300">
                    -
                  </p>
                ) : (
                  events.map((e) => <EventItem key={e.id} event={e} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventPill({ event }: { event: Evenement }) {
  const className =
    "block truncate rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white"
  const style = { backgroundColor: event.color }
  if (event.url) {
    return (
      <Link
        href={event.url}
        onClick={(e) => e.stopPropagation()}
        className={className}
        style={style}
        title={event.title}
      >
        {event.title}
      </Link>
    )
  }
  return (
    <span className={className} style={style} title={event.title}>
      {event.title}
    </span>
  )
}

function EventItem({
  event,
  large = false,
  canDelete = false,
  onDelete,
}: {
  event: Evenement
  large?: boolean
  canDelete?: boolean
  onDelete?: () => void
}) {
  const Icon = TYPE_ICONS[event.type]
  const date = new Date(event.date)
  const showTime =
    date.getHours() !== 0 || date.getMinutes() !== 0
      ? formatTime(date)
      : null
  const hasLink = event.url.length > 0
  const label =
    event.type === "evenement_manuel"
      ? MANUAL_TYPE_LABEL[event.subtype] ?? TYPE_LABELS[event.type]
      : TYPE_LABELS[event.type]

  const content = (
    <>
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: event.color }}
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-zinc-900",
            large ? "text-sm font-medium" : "text-[11px] font-medium"
          )}
        >
          {event.title}
        </p>
        <p className="text-[10px] text-zinc-500">
          {label}
          {event.clientName ? ` - ${event.clientName}` : ""}
          {showTime ? ` - ${showTime}` : ""}
        </p>
        {large && event.notes && (
          <p className="mt-1 text-xs text-zinc-600">{event.notes}</p>
        )}
      </div>
      {canDelete && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Supprimer"
          className="ml-1 shrink-0 rounded-md p-1 text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </>
  )

  const className = cn(
    "flex items-start gap-2 rounded-md border-l-2 bg-zinc-50 px-2 py-1.5 transition-colors",
    hasLink && "hover:bg-zinc-100",
    large && "px-3 py-2.5"
  )

  if (hasLink) {
    return (
      <Link
        href={event.url}
        className={className}
        style={{ borderLeftColor: event.color }}
      >
        {content}
      </Link>
    )
  }
  return (
    <div className={className} style={{ borderLeftColor: event.color }}>
      {content}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  )
}

function LegendGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {children}
      </div>
    </div>
  )
}
