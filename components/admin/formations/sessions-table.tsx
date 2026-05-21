"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  PlusCircle,
  Trash2,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SessionForm,
  type SessionFormInitial,
} from "@/components/admin/formations/session-form"
import {
  SESSION_STATUSES,
  SESSION_STATUS_KEYS,
  formatPrice,
  formatSessionDate,
  getJaugePercent,
  isBientotComplet,
  type SessionStatus,
} from "@/lib/formations"
import { cn } from "@/lib/utils"

type SessionRow = {
  id: string
  title: string
  dateStart: string
  dateEnd: string
  location: string
  maxSeats: number
  price: number
  description: string | null
  status: SessionStatus
  counts: {
    en_attente: number
    confirme: number
    liste_attente: number
    annule: number
  }
  remaining: number
}

export function SessionsTable() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"" | SessionStatus>("")
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<SessionFormInitial | undefined>(
    undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    try {
      const r = await fetch(`/api/formations/sessions?${params}`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as SessionRow[]
      setSessions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    const handler = () => {
      setFormInitial(undefined)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/formations/sessions/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
      } else {
        setDeleteTarget(null)
        fetchSessions()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-56">
          <label
            htmlFor="sessions-status"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Statut
          </label>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(v) =>
              setStatusFilter(v === "_all" ? "" : (v as SessionStatus))
            }
          >
            <SelectTrigger id="sessions-status" className="mt-1">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Toutes</SelectItem>
              {SESSION_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SESSION_STATUSES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setFormInitial(undefined)
            setFormOpen(true)
          }}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" /> Nouvelle session
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="text-sm text-zinc-600">
            Aucune session pour le moment.
          </p>
          <Button
            onClick={() => {
              setFormInitial(undefined)
              setFormOpen(true)
            }}
            className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            Creer la premiere session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => {
            const occupied = s.counts.en_attente + s.counts.confirme
            const percent = getJaugePercent(s.counts.confirme, s.maxSeats)
            const showAlert = isBientotComplet(s.remaining, s.maxSeats)
            return (
              <article
                key={s.id}
                className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-900">
                    {s.title}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      SESSION_STATUSES[s.status].color
                    )}
                  >
                    {SESSION_STATUSES[s.status].label}
                  </span>
                </div>

                <dl className="mt-3 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                    {formatSessionDate(s.dateStart, s.dateEnd)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {s.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    {s.maxSeats} places - {formatPrice(s.price)}
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {s.counts.confirme}/{s.maxSeats} confirmes
                    </span>
                    {showAlert && (
                      <span className="rounded-full bg-[#F5B800] px-2 py-0.5 text-[10px] font-semibold text-zinc-900">
                        Bientot complet
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full bg-[#C8151B] transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
                  <Stat label="Confirmes" value={s.counts.confirme} accent="emerald" />
                  <Stat
                    label="En attente"
                    value={s.counts.en_attente}
                    accent="amber"
                  />
                  <Stat
                    label="Liste att."
                    value={s.counts.liste_attente}
                    accent="blue"
                  />
                  <Stat label="Libres" value={s.remaining} accent="zinc" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/formations/${s.id}`}>
                      <Eye className="mr-1 h-4 w-4" /> Inscriptions ({occupied})
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormInitial({
                        id: s.id,
                        title: s.title,
                        dateStart: s.dateStart,
                        dateEnd: s.dateEnd,
                        location: s.location,
                        maxSeats: s.maxSeats,
                        price: s.price,
                        description: s.description,
                        status: s.status,
                      })
                      setFormOpen(true)
                    }}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Supprimer"
                    onClick={() => setDeleteTarget(s)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <SessionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={fetchSessions}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette session ?</DialogTitle>
            <DialogDescription>
              La suppression est definitive et impossible si des inscriptions
              confirmees sont liees a la session. Annulez la session a la
              place pour conserver l&apos;historique.
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
              onClick={handleDelete}
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: "emerald" | "amber" | "blue" | "zinc"
}) {
  const map: Record<typeof accent, string> = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    blue: "text-blue-700 bg-blue-50",
    zinc: "text-zinc-700 bg-zinc-50",
  }
  return (
    <div className={cn("rounded-md px-2 py-1.5", map[accent])}>
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider">
        {label}
      </p>
    </div>
  )
}
