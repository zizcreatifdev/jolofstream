"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Download,
  MapPin,
  Pencil,
  PlusCircle,
  Users,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SessionForm,
  type SessionFormInitial,
} from "@/components/admin/formations/session-form"
import { ManualRegistrationForm } from "@/components/admin/formations/manual-registration-form"
import {
  REGISTRATION_STATUSES,
  SESSION_STATUSES,
  SESSION_STATUS_KEYS,
  formatPrice,
  formatSessionDate,
  getJaugePercent,
  type RegistrationStatus,
  type SessionStatus,
} from "@/lib/formations"
import { cn } from "@/lib/utils"

export type Registration = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: RegistrationStatus
  waitlistPosition: number | null
  registeredAt: string
  confirmedAt: string | null
  message: string | null
}

export type SessionDetail = {
  id: string
  title: string
  dateStart: string
  dateEnd: string
  location: string
  maxSeats: number
  price: number
  description: string | null
  status: SessionStatus
  registrations: Registration[]
  counts: {
    en_attente: number
    confirme: number
    liste_attente: number
    annule: number
  }
  remaining: number
}

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const v = (cell ?? "").toString()
          if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`
          return v
        })
        .join(";")
    )
    .join("\n")
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function SessionDetailView({ session }: { session: SessionDetail }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const percent = getJaugePercent(session.counts.confirme, session.maxSeats)

  const tabs = useMemo(
    () => ({
      all: session.registrations.filter((r) => r.status !== "annule"),
      confirmed: session.registrations.filter((r) => r.status === "confirme"),
      pending: session.registrations.filter((r) => r.status === "en_attente"),
      waitlist: session.registrations.filter(
        (r) => r.status === "liste_attente"
      ),
    }),
    [session.registrations]
  )

  const initial: SessionFormInitial = {
    id: session.id,
    title: session.title,
    dateStart: session.dateStart,
    dateEnd: session.dateEnd,
    location: session.location,
    maxSeats: session.maxSeats,
    price: session.price,
    description: session.description,
    status: session.status,
  }

  const callAction = async (
    id: string,
    action: "confirmer" | "annuler" | "mettre_en_attente"
  ) => {
    setBusy(id)
    setError(null)
    try {
      const r = await fetch(`/api/formations/inscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Action impossible."
        )
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(null)
    }
  }

  const handleStatusChange = async (status: SessionStatus) => {
    setBusy("session-status")
    setError(null)
    try {
      const r = await fetch(`/api/formations/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Mise a jour impossible."
        )
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(null)
    }
  }

  const exportCsv = () => {
    const rows: string[][] = [
      [
        "Prenom",
        "Nom",
        "Email",
        "Telephone",
        "Statut",
        "Position liste attente",
        "Date inscription",
        "Date confirmation",
        "Message",
      ],
      ...session.registrations.map((r) => [
        r.firstName,
        r.lastName,
        r.email,
        r.phone ?? "",
        REGISTRATION_STATUSES[r.status].label,
        r.waitlistPosition !== null ? String(r.waitlistPosition) : "",
        formatDateTime(r.registeredAt),
        formatDateTime(r.confirmedAt),
        r.message ?? "",
      ]),
    ]
    const slug = session.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    downloadCsv(`inscriptions-${slug}.csv`, rows)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                SESSION_STATUSES[session.status].color
              )}
            >
              {SESSION_STATUSES[session.status].label}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900">
              {session.title}
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                {formatSessionDate(session.dateStart, session.dateEnd)}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {session.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-zinc-400" />
                {session.maxSeats} places - {formatPrice(session.price)}
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Modifier la session
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">
              {session.counts.confirme}/{session.maxSeats} places confirmees
            </span>
            <span className="font-semibold text-zinc-900">{percent}%</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full bg-[#C8151B] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Places total" value={session.maxSeats} accent="zinc" />
          <Stat label="Confirmees" value={session.counts.confirme} accent="emerald" />
          <Stat
            label="En attente paiement"
            value={session.counts.en_attente}
            accent="amber"
          />
          <Stat
            label="Liste d'attente"
            value={session.counts.liste_attente}
            accent="blue"
          />
          <Stat label="Places libres" value={session.remaining} accent="zinc" />
        </dl>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="session-status-change"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Changer le statut
            </label>
            <Select
              value={session.status}
              onValueChange={(v) => handleStatusChange(v as SessionStatus)}
              disabled={busy === "session-status"}
            >
              <SelectTrigger id="session-status-change" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_STATUS_KEYS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SESSION_STATUSES[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-dashed border-[#F5B800] bg-[#F5B800]/10 px-3 py-2 text-xs text-zinc-700">
            <p className="font-medium">
              Lien Wave : a configurer dans Parametres (Prompt 11)
            </p>
            <p className="text-zinc-600">
              Montant attendu : {formatPrice(session.price)} - communiquer le
              lien Wave Business par email apres confirmation.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">Inscriptions</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={session.registrations.length === 0}
            >
              <Download className="mr-1.5 h-4 w-4" /> Exporter CSV
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              size="sm"
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter une inscription
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="mt-4">
          <TabsList>
            <TabsTrigger value="all">
              Toutes ({tabs.all.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmes ({tabs.confirmed.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({tabs.pending.length})
            </TabsTrigger>
            <TabsTrigger value="waitlist">
              Liste d&apos;attente ({tabs.waitlist.length})
            </TabsTrigger>
          </TabsList>

          {(
            [
              ["all", tabs.all],
              ["confirmed", tabs.confirmed],
              ["pending", tabs.pending],
              ["waitlist", tabs.waitlist],
            ] as const
          ).map(([key, items]) => (
            <TabsContent key={key} value={key} className="mt-3">
              <RegistrationsList
                items={items}
                price={session.price}
                busy={busy}
                onAction={callAction}
              />
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <SessionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={initial}
        onSaved={() => router.refresh()}
      />

      <ManualRegistrationForm
        open={addOpen}
        onOpenChange={setAddOpen}
        sessionId={session.id}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

function RegistrationsList({
  items,
  price,
  busy,
  onAction,
}: {
  items: Registration[]
  price: number
  busy: string | null
  onAction: (
    id: string,
    action: "confirmer" | "annuler" | "mettre_en_attente"
  ) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
        Aucune inscription dans cette categorie.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Inscrit</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Inscription</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => {
            const isBusy = busy === r.id
            return (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium text-zinc-900">
                    {r.firstName} {r.lastName}
                  </div>
                  {r.waitlistPosition !== null && (
                    <div className="text-xs text-blue-600">
                      Position {r.waitlistPosition} en liste d&apos;attente
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-zinc-700">
                  <a
                    href={`mailto:${r.email}`}
                    className="block hover:text-zinc-900"
                  >
                    {r.email}
                  </a>
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="block text-xs text-zinc-500 hover:text-zinc-700"
                    >
                      {r.phone}
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-xs text-zinc-600">
                  {formatDateTime(r.registeredAt)}
                  {r.confirmedAt && (
                    <span className="block text-emerald-600">
                      Confirme : {formatDateTime(r.confirmedAt)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      REGISTRATION_STATUSES[r.status].color
                    )}
                  >
                    {REGISTRATION_STATUSES[r.status].label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {r.status === "en_attente" && (
                      <Button
                        size="sm"
                        onClick={() => onAction(r.id, "confirmer")}
                        disabled={isBusy}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        title={`Paiement attendu : ${formatPrice(price)}`}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Confirmer paiement
                      </Button>
                    )}
                    {r.status === "confirme" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(r.id, "mettre_en_attente")}
                        disabled={isBusy}
                      >
                        Remettre en attente
                      </Button>
                    )}
                    {r.status !== "annule" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAction(r.id, "annuler")}
                        disabled={isBusy}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
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
    <div className={cn("rounded-md p-3 text-center", map[accent])}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </p>
    </div>
  )
}
