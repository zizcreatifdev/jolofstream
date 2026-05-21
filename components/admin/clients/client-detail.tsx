"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Pencil, Phone, Tag, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ClientForm,
  type ClientFormInitial,
} from "@/components/admin/clients/client-form"
import {
  acquisitionLabels,
  clientStatusBadge,
  clientStatusLabels,
  clientTypeBadge,
  clientTypeLabels,
  initialsOf,
  type AcquisitionChannel,
  type ClientStatus,
  type ClientType,
} from "@/lib/clients"
import { cn } from "@/lib/utils"

type RelatedRow = {
  id: string
  reference?: string | null
  title?: string | null
  status: string
  totalTtc?: number | null
  createdAt: string | Date
}

export type ClientDetail = {
  id: string
  type: ClientType
  name: string
  email: string | null
  phone: string | null
  organization: string | null
  acquisitionChannel: string | null
  status: ClientStatus
  tvaExempt: boolean
  notes: string | null
  tags: string[]
  projects: Array<{
    id: string
    title: string
    status: string
    type: string
    date: Date | string | null
  }>
  quotes: Array<{
    id: string
    reference: string
    status: string
    totalTtc: number
    createdAt: Date | string
  }>
  invoices: Array<{
    id: string
    reference: string
    status: string
    totalTtc: number
    createdAt: Date | string
  }>
  _count: { projects: number; quotes: number; invoices: number }
}

function formatDate(value: Date | string | null) {
  if (!value) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value) + " FCFA"
}

export function ClientDetailView({ client }: { client: ClientDetail }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channel = client.acquisitionChannel as AcquisitionChannel | null

  const initial: ClientFormInitial = {
    id: client.id,
    type: client.type,
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    organization: client.organization ?? "",
    acquisitionChannel: client.acquisitionChannel ?? "",
    status: client.status,
    tvaExempt: client.tvaExempt,
    notes: client.notes ?? "",
    tags: client.tags,
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
        return
      }
      router.push("/admin/clients")
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <aside className="lg:col-span-1">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C8151B] text-2xl font-bold text-white">
              {initialsOf(client.name)}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-zinc-900">
              {client.name}
            </h2>
            {client.organization && (
              <p className="mt-1 text-sm text-zinc-500">
                {client.organization}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  clientTypeBadge[client.type]
                )}
              >
                {clientTypeLabels[client.type]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  clientStatusBadge[client.status]
                )}
              >
                {clientStatusLabels[client.status]}
              </span>
              {client.tvaExempt && (
                <span className="inline-flex items-center rounded-full bg-[#F5B800]/20 px-2.5 py-0.5 text-xs font-semibold text-[#8a6500]">
                  TVA exoneree
                </span>
              )}
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-zinc-700 hover:text-zinc-900"
                >
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <a
                  href={`tel:${client.phone}`}
                  className="text-zinc-700 hover:text-zinc-900"
                >
                  {client.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <span className="text-zinc-700">
                {channel ? acquisitionLabels[channel] ?? channel : "Canal non renseigne"}
              </span>
            </div>
          </dl>

          {client.tags.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Tags
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {client.notes && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {client.notes}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </Button>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-2">
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">
              Projets ({client._count.projects})
            </TabsTrigger>
            <TabsTrigger value="quotes">
              Devis ({client._count.quotes})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Factures ({client._count.invoices})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            {client.projects.length === 0 ? (
              <EmptyHistory
                label="projet"
                href="/admin/projets"
                cta="Creer un projet"
              />
            ) : (
              <ul className="space-y-2">
                {client.projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/projets/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {p.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {p.type} - {formatDate(p.date)}
                        </p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        {p.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-4">
            {client.quotes.length === 0 ? (
              <EmptyHistory
                label="devis"
                href="/admin/devis-factures"
                cta="Creer un devis"
              />
            ) : (
              <RelatedList items={client.quotes} prefix="/admin/devis-factures" />
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            {client.invoices.length === 0 ? (
              <EmptyHistory
                label="facture"
                href="/admin/devis-factures"
                cta="Creer une facture"
              />
            ) : (
              <RelatedList items={client.invoices} prefix="/admin/devis-factures" />
            )}
          </TabsContent>
        </Tabs>
      </section>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={initial}
        onSaved={() => router.refresh()}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Si le client a des projets, devis
              ou factures associes, la suppression sera refusee.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-700">
            <span className="font-semibold">{client.name}</span>
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
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

function EmptyHistory({
  label,
  href,
  cta,
}: {
  label: string
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center">
      <p className="text-sm text-zinc-600">Aucun {label} pour ce client.</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

function RelatedList({
  items,
  prefix,
}: {
  items: RelatedRow[]
  prefix: string
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`${prefix}/${item.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {item.reference ?? item.title ?? item.id}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-900">
                {formatAmount(item.totalTtc)}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                {item.status}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
