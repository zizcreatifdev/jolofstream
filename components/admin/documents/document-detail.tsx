"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileMinus,
  FileText,
  Mail,
  Pencil,
  RefreshCw,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DocumentForm,
  type DocumentFormInitial,
  type DocumentKind,
} from "@/components/admin/documents/document-form"
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_KEYS,
  INVOICE_TYPES,
  QUOTE_STATUSES,
  QUOTE_STATUS_KEYS,
  formatAmount,
  formatDate,
  type InvoiceStatus,
  type InvoiceType,
  type QuoteStatus,
} from "@/lib/documents"
import { usePdfCompany } from "@/lib/use-pdf-company"
import { DocumentPreview } from "@/components/admin/documents/document-preview"
import { cn } from "@/lib/utils"

const PdfDownload = dynamic(
  () => import("@/components/admin/documents/pdf-download"),
  { ssr: false, loading: () => null }
)

type Line = {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

type ClientInfo = {
  id: string
  name: string
  organization: string | null
  email: string | null
  phone: string | null
  tvaExempt: boolean
}

export type DocumentDetail = {
  id: string
  kind: DocumentKind
  reference: string
  subject?: string | null
  status: string
  invoiceType?: InvoiceType
  client: ClientInfo
  project: { id: string; title: string } | null
  brsEnabled: boolean
  tvaEnabled: boolean
  subtotalHt: number
  brsAmount: number
  tvaAmount: number
  totalTtc: number
  validUntil?: string | null
  dueAt?: string | null
  issuedAt?: string | null
  createdAt: string
  notes: string | null
  lines: Line[]
}

export function DocumentDetailView({ doc }: { doc: DocumentDetail }) {
  const router = useRouter()
  const company = usePdfCompany()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDevis = doc.kind === "devis"
  const statusLabel = isDevis
    ? QUOTE_STATUSES[doc.status as QuoteStatus]
    : INVOICE_STATUSES[doc.status as InvoiceStatus]

  const initial: DocumentFormInitial = {
    id: doc.id,
    clientId: doc.client.id,
    projectId: doc.project?.id ?? null,
    subject: doc.subject ?? "",
    status: doc.status,
    brsEnabled: doc.brsEnabled,
    tvaEnabled: doc.tvaEnabled,
    dateField: isDevis ? doc.validUntil ?? null : doc.dueAt ?? null,
    notes: doc.notes,
    invoiceType: doc.invoiceType,
    lines: doc.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
  }

  const pdfProps = {
    type: doc.kind,
    invoiceType: doc.invoiceType,
    reference: doc.reference,
    date: formatDate(doc.issuedAt ?? doc.createdAt),
    validUntil: isDevis ? formatDate(doc.validUntil) : undefined,
    dueDate: !isDevis ? formatDate(doc.dueAt) : undefined,
    client: {
      name: doc.client.name,
      organization: doc.client.organization,
      email: doc.client.email,
      phone: doc.client.phone,
    },
    lines: doc.lines,
    subtotalHt: doc.subtotalHt,
    brsEnabled: doc.brsEnabled,
    brsAmount: doc.brsAmount,
    tvaEnabled: doc.tvaEnabled,
    tvaAmount: doc.tvaAmount,
    tvaExempt: doc.client.tvaExempt,
    totalTtc: doc.totalTtc,
    notes: doc.notes,
    ...company,
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const r = await fetch(`/api/devis/${doc.id}`, { method: "DELETE" })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
        return
      }
      router.push("/admin/devis-factures")
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (next: string) => {
    setBusy(true)
    setError(null)
    try {
      const url = isDevis
        ? `/api/devis/${doc.id}`
        : `/api/factures/${doc.id}`
      const r = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
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
      setBusy(false)
    }
  }

  const handleConvert = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/devis/${doc.id}/convertir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "standard" }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Conversion impossible."
        )
        return
      }
      const invoice = (await r.json()) as { id: string }
      router.push(`/admin/devis-factures/${invoice.id}?kind=facture`)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  const handleAvoir = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/factures/${doc.id}/avoir`, {
        method: "POST",
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Creation impossible."
        )
        return
      }
      const avoir = (await r.json()) as { id: string }
      router.push(`/admin/devis-factures/${avoir.id}?kind=facture`)
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  const sendQuoteEmail = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/devis/${doc.id}/envoyer`, {
        method: "POST",
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Envoi impossible."
        )
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  const sendInvoiceReminder = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/factures/relances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: doc.id }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Relance impossible."
        )
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusy(false)
    }
  }

  const statusKeys: string[] = isDevis
    ? (QUOTE_STATUS_KEYS as readonly string[]).slice()
    : (INVOICE_STATUS_KEYS as readonly string[]).slice()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_640px]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {isDevis ? "Devis" : "Facture"}
              {doc.invoiceType && doc.invoiceType !== "standard"
                ? ` - ${INVOICE_TYPES[doc.invoiceType]}`
                : ""}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-zinc-900">
              {doc.reference}
            </h2>
            {doc.subject && (
              <p className="mt-1 text-sm text-zinc-600">{doc.subject}</p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusLabel.color
            )}
          >
            {statusLabel.label}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Client
            </dt>
            <dd className="mt-0.5">
              <Link
                href={`/admin/clients/${doc.client.id}`}
                className="text-zinc-900 hover:text-[#C8151B]"
              >
                {doc.client.name}
              </Link>
              {doc.client.organization && (
                <span className="block text-xs text-zinc-500">
                  {doc.client.organization}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Projet
            </dt>
            <dd className="mt-0.5">
              {doc.project ? (
                <Link
                  href={`/admin/projets/${doc.project.id}`}
                  className="text-zinc-900 hover:text-[#C8151B]"
                >
                  {doc.project.title}
                </Link>
              ) : (
                <span className="text-zinc-500">-</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {isDevis ? "Valide jusqu'au" : "Echeance"}
            </dt>
            <dd className="mt-0.5 text-zinc-900">
              {formatDate(isDevis ? doc.validUntil : doc.dueAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total TTC
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-[#C8151B]">
              {formatAmount(doc.totalTtc)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label
                htmlFor="status-change"
                className="text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Changer le statut
              </label>
              <Select
                value={doc.status}
                onValueChange={handleStatusChange}
                disabled={busy}
              >
                <SelectTrigger id="status-change">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusKeys.map((s) => (
                    <SelectItem key={s} value={s}>
                      {isDevis
                        ? QUOTE_STATUSES[s as QuoteStatus].label
                        : INVOICE_STATUSES[s as InvoiceStatus].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PdfDownload
              {...pdfProps}
              fileName={`${doc.reference}.pdf`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDevis && doc.status === "brouillon" && (
              <Button
                onClick={() => setEditOpen(true)}
                className="bg-[#C8151B] text-white hover:bg-[#a01015]"
                size="sm"
              >
                <Pencil className="mr-1.5 h-4 w-4" /> Modifier
              </Button>
            )}
            {isDevis &&
              (doc.status === "brouillon" || doc.status === "envoye") && (
                <Button
                  onClick={sendQuoteEmail}
                  disabled={busy}
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Mail className="mr-1.5 h-4 w-4" /> Envoyer par email
                </Button>
              )}
            {isDevis && doc.status === "accepte" && (
              <Button
                onClick={handleConvert}
                disabled={busy}
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Convertir en facture
              </Button>
            )}
            {!isDevis && doc.status === "emise" && (
              <Button
                onClick={() => handleStatusChange("payee")}
                disabled={busy}
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FileText className="mr-1.5 h-4 w-4" /> Marquer payee
              </Button>
            )}
            {!isDevis &&
              (doc.status === "emise" || doc.status === "partiellement_payee") &&
              doc.invoiceType !== "avoir" && (
                <Button
                  variant="outline"
                  onClick={sendInvoiceReminder}
                  disabled={busy}
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Mail className="mr-1.5 h-4 w-4" /> Envoyer une relance
                </Button>
              )}
            {!isDevis &&
              doc.invoiceType !== "avoir" &&
              doc.status !== "annulee" && (
                <Button
                  variant="outline"
                  onClick={handleAvoir}
                  disabled={busy}
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <FileMinus className="mr-1.5 h-4 w-4" /> Creer un avoir
                </Button>
              )}
            {isDevis && doc.status === "brouillon" && (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Lignes
          </h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">
                    Description
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">
                    Qte
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">
                    PU
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {doc.lines.map((l, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="px-3 py-2 text-zinc-900">{l.description}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">
                      {l.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-700">
                      {formatAmount(l.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-zinc-900">
                      {formatAmount(l.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Sous-total HT</dt>
              <dd>{formatAmount(doc.subtotalHt)}</dd>
            </div>
            {doc.brsEnabled && (
              <div className="flex justify-between">
                <dt className="text-zinc-600">BRS 5%</dt>
                <dd>{formatAmount(doc.brsAmount)}</dd>
              </div>
            )}
            {doc.tvaEnabled && (
              <div className="flex justify-between">
                <dt className="text-zinc-600">TVA 18%</dt>
                <dd>{formatAmount(doc.tvaAmount)}</dd>
              </div>
            )}
            {doc.client.tvaExempt && (
              <div className="flex justify-between text-[#C8151B]">
                <dt>TVA</dt>
                <dd>Exoneree</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
              <dt>Total TTC</dt>
              <dd>{formatAmount(doc.totalTtc)}</dd>
            </div>
          </dl>
        </div>

        {doc.notes && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
              {doc.notes}
            </p>
          </div>
        )}
      </div>

      <aside className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 shadow-sm">
        <div className="max-h-[900px] overflow-y-auto">
          <DocumentPreview {...pdfProps} />
        </div>
      </aside>

      <DocumentForm
        kind="devis"
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={initial}
        onSaved={() => router.refresh()}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce devis ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Seuls les devis brouillon peuvent
              etre supprimes.
            </DialogDescription>
          </DialogHeader>
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
