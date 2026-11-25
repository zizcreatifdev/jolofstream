"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ExternalLink, FileText, Mail, MessageCircle, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  QUOTE_NEEDS,
  QUOTE_NEED_KEYS,
  QUOTE_STATUSES,
  QUOTE_STATUS_KEYS,
  camerasLabel,
  desiredDateLabel,
  needLabel,
  platformsLabel,
  whatsappHref,
  type QuoteStatus,
} from "@/lib/quote-requests"
import type { QuoteRequestView } from "@/lib/quote-requests-server"
import { cn } from "@/lib/utils"

const ALL = "tous"

const CREATED = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
})

function StatusBadge({ status }: { status: string }) {
  const meta = QUOTE_STATUSES[status as QuoteStatus]
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", meta?.color ?? "bg-zinc-100 text-zinc-600")}>
      {meta?.label ?? status}
    </span>
  )
}

// /admin/demandes : liste filtrable et detail en panneau lateral (?demande=)
export function DemandesBoard({
  demandes,
  counts,
  status,
  need,
  selected,
}: {
  demandes: QuoteRequestView[]
  counts: Record<string, number>
  status: string
  need: string
  selected: QuoteRequestView | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="filtre-statut" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Statut
          </label>
          <Select value={status || ALL} onValueChange={(v) => setParam("statut", v === ALL ? null : v)}>
            <SelectTrigger id="filtre-statut" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts ({total})</SelectItem>
              {QUOTE_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {QUOTE_STATUSES[s].label} ({counts[s] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtre-besoin" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Besoin
          </label>
          <Select value={need || ALL} onValueChange={(v) => setParam("besoin", v === ALL ? null : v)}>
            <SelectTrigger id="filtre-besoin" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les besoins</SelectItem>
              {QUOTE_NEED_KEYS.map((n) => (
                <SelectItem key={n} value={n}>
                  {QUOTE_NEEDS[n].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 text-sm text-zinc-500">
          {demandes.length} demande{demandes.length > 1 ? "s" : ""}
        </p>
      </div>

      {demandes.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
          Aucune demande pour ces filtres.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="hidden border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Reçue le</th>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Besoin</th>
                <th className="px-4 py-3 font-medium">Date souhaitée</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {demandes.map((d) => (
                <tr key={d.id} className="block cursor-pointer hover:bg-zinc-50 md:table-row" onClick={() => setParam("demande", d.id)}>
                  <td className="block px-4 pt-3 text-xs text-zinc-500 md:table-cell md:py-3 md:text-sm">
                    {CREATED.format(new Date(d.createdAt))}
                  </td>
                  <td className="block px-4 md:table-cell md:py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setParam("demande", d.id)
                      }}
                      className="min-h-[44px] text-left font-semibold text-zinc-900 hover:underline md:min-h-0"
                    >
                      {d.client.name}
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{d.organization || d.client.organization || "-"}</td>
                  <td className="block px-4 text-zinc-700 md:table-cell md:py-3">{needLabel(d.need)}</td>
                  <td className="block px-4 text-zinc-600 md:table-cell md:py-3">{desiredDateLabel(d.desiredDate)}</td>
                  <td className="block px-4 pb-3 pt-1 md:table-cell md:py-3">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DemandeSheet demande={selected} onClose={() => setParam("demande", null)} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{children}</dd>
    </div>
  )
}

function DemandeSheet({ demande, onClose }: { demande: QuoteRequestView | null; onClose: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeStatus = async (status: string) => {
    if (!demande) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/demandes/${demande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError((data && data.error) || "Changement impossible.")
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  const d = demande
  const wa = d ? whatsappHref(d.client.phone) : null
  const subject = d ? `${needLabel(d.need)}${d.desiredDate ? `, ${desiredDateLabel(d.desiredDate)}` : ""}${d.location ? `, ${d.location}` : ""}` : ""
  const createQuoteHref = d
    ? `/admin/devis-factures?demande=${d.id}&clientId=${d.client.id}&objet=${encodeURIComponent(subject.slice(0, 120))}`
    : "#"

  return (
    <Sheet open={Boolean(d)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:!max-w-[520px]">
        {d && (
          <>
            <SheetHeader>
              <SheetTitle>{d.client.name}</SheetTitle>
              <SheetDescription>
                {needLabel(d.need)} · reçue le {CREATED.format(new Date(d.createdAt))}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {d.client.phone && (
                  <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                    <a href={`tel:${d.client.phone}`}>
                      <Phone className="mr-1.5 h-4 w-4" /> {d.client.phone}
                    </a>
                  </Button>
                )}
                {wa && (
                  <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {d.client.email && (
                  <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                    <a href={`mailto:${d.client.email}`}>
                      <Mail className="mr-1.5 h-4 w-4" /> {d.client.email}
                    </a>
                  </Button>
                )}
              </div>

              <dl className="grid grid-cols-1 gap-4 rounded-lg bg-zinc-50 p-4 sm:grid-cols-2">
                <Field label="Besoin">{needLabel(d.need)}</Field>
                <Field label="Date souhaitée">{desiredDateLabel(d.desiredDate)}</Field>
                <Field label="Lieu">{d.location || "-"}</Field>
                <Field label="Organisation">{d.organization || d.client.organization || "-"}</Field>
                {d.platforms.length > 0 && <Field label="Diffusion">{platformsLabel(d.platforms)}</Field>}
                {d.cameras && <Field label="Caméras">{camerasLabel(d.cameras)}</Field>}
                {d.participants !== null && <Field label="Participants">{d.participants}</Field>}
              </dl>

              {d.description && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Projet</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{d.description}</p>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="demande-statut" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Statut
                </label>
                <Select value={d.status} onValueChange={(v) => void changeStatus(v)} disabled={busy}>
                  <SelectTrigger id="demande-statut" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUS_KEYS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {QUOTE_STATUSES[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                {d.quote ? (
                  <Button asChild variant="outline">
                    <Link href={`/admin/devis-factures/${d.quote.id}`}>
                      <FileText className="mr-1.5 h-4 w-4" /> Devis {d.quote.reference}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="bg-[#C8151B] text-white hover:bg-[#a01015]">
                    <Link href={createQuoteHref}>
                      <FileText className="mr-1.5 h-4 w-4" /> Créer un devis
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/admin/clients/${d.client.id}`}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Fiche client
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
