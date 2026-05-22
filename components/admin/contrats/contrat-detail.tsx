"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Download,
  Mail,
  Send,
  Trash2,
  X,
  XCircle,
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
  CONTRAT_STATUSES,
  TEMPLATE_TYPES,
  contratReference,
  type ContratStatus,
  type TemplateType,
} from "@/lib/contrats"
import { cn } from "@/lib/utils"

type ContratDetailData = {
  id: string
  status: ContratStatus
  templateType: TemplateType
  notes: string | null
  fileUrl: string | null
  signedAt: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    organization: string | null
    email: string | null
    phone: string | null
  }
  project: { id: string; title: string; type: string }
  creator: { firstName: string; lastName: string; email: string }
}

function formatDate(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function ContratDetail({ id }: { id: string }) {
  const router = useRouter()
  const [contrat, setContrat] = useState<ContratDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/contrats/${id}`, { cache: "no-store" })
      if (!r.ok) throw new Error("Contrat introuvable")
      setContrat((await r.json()) as ContratDetailData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const changeStatus = async (status: ContratStatus) => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/contrats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec mise a jour")
      }
      await load()
      setConfirmCancel(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  const envoyerParEmail = async () => {
    if (!contrat) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(`/api/contrats/${contrat.id}/envoyer`, {
        method: "POST",
      })
      const data = (await r.json().catch(() => null)) as {
        emailSent?: boolean
        hadEmail?: boolean
        error?: string
      } | null
      if (!r.ok) throw new Error(data?.error || "Echec de l'envoi")
      if (data?.emailSent) {
        setInfo(`Contrat envoye par email a ${contrat.client.email}.`)
      } else if (data?.hadEmail) {
        setInfo(
          "Statut passe a Envoye. L'email n'a pas pu etre delivre (Resend indisponible)."
        )
      } else {
        setInfo(
          "Statut passe a Envoye. Le client n'a pas d'adresse email enregistree."
        )
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  const downloadPdf = async () => {
    if (!contrat) return
    try {
      const r = await fetch(`/api/contrats/${contrat.id}/pdf`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error("Echec PDF")
      const blob = await r.blob()
      const ref = contratReference(contrat.id)
      const link = document.createElement("a")
      const href = URL.createObjectURL(blob)
      link.href = href
      link.download = `contrat-${ref}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF")
    }
  }

  const deleteContrat = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/contrats/${id}`, { method: "DELETE" })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec suppression")
      }
      router.push("/admin/contrats")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        Chargement...
      </div>
    )
  }

  if (!contrat) {
    return (
      <div className="space-y-3">
        <Link
          href="/admin/contrats"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-[#C8151B]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour aux contrats
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Contrat introuvable."}
        </div>
      </div>
    )
  }

  const statusMeta = CONTRAT_STATUSES[contrat.status]
  const ref = contratReference(contrat.id)
  const isCancelable =
    contrat.status === "a_envoyer" ||
    contrat.status === "envoye" ||
    contrat.status === "refuse"

  return (
    <div className="space-y-6">
      <Link
        href="/admin/contrats"
        className="inline-flex items-center text-sm text-zinc-600 hover:text-[#C8151B]"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Retour aux contrats
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Reference
          </p>
          <p className="font-mono text-lg font-semibold text-zinc-900">
            {ref}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            {TEMPLATE_TYPES[contrat.templateType] ?? contrat.templateType}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusMeta?.color
              )}
            >
              {statusMeta?.label}
            </span>
            <span className="text-xs text-zinc-500">
              Cree le {formatDate(contrat.createdAt)}
              {contrat.signedAt
                ? ` - signe le ${formatDate(contrat.signedAt)}`
                : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={downloadPdf} disabled={busy}>
            <Download className="mr-1.5 h-4 w-4" /> Telecharger PDF
          </Button>
          {contrat.status === "a_envoyer" && (
            <>
              {contrat.client.email ? (
                <Button
                  onClick={envoyerParEmail}
                  disabled={busy}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Mail className="mr-1.5 h-4 w-4" /> Envoyer par email
                </Button>
              ) : (
                <Button
                  onClick={() => changeStatus("envoye")}
                  disabled={busy}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  title="Le client n'a pas d'email - statut change uniquement"
                >
                  <Send className="mr-1.5 h-4 w-4" /> Marquer envoye
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
            </>
          )}
          {contrat.status === "envoye" && (
            <>
              <Button
                onClick={() => changeStatus("signe")}
                disabled={busy}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="mr-1.5 h-4 w-4" /> Marquer signe
              </Button>
              <Button
                variant="outline"
                onClick={() => changeStatus("refuse")}
                disabled={busy}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="mr-1.5 h-4 w-4" /> Marquer refuse
              </Button>
            </>
          )}
          {isCancelable && contrat.status !== "a_envoyer" && (
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(true)}
              disabled={busy}
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Annuler le contrat
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-zinc-900">Parties</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Client
              </p>
              <Link
                href={`/admin/clients/${contrat.client.id}`}
                className="font-medium text-zinc-900 hover:text-[#C8151B]"
              >
                {contrat.client.name}
              </Link>
              {contrat.client.organization && (
                <p className="text-xs text-zinc-500">
                  {contrat.client.organization}
                </p>
              )}
              {contrat.client.email && (
                <p className="text-xs text-zinc-600">{contrat.client.email}</p>
              )}
              {contrat.client.phone && (
                <p className="text-xs text-zinc-600">{contrat.client.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Projet
              </p>
              <Link
                href={`/admin/projets/${contrat.project.id}`}
                className="font-medium text-zinc-900 hover:text-[#C8151B]"
              >
                {contrat.project.title}
              </Link>
              <p className="text-xs text-zinc-500">{contrat.project.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Createur
              </p>
              <p className="text-sm text-zinc-700">
                {contrat.creator.firstName} {contrat.creator.lastName}
              </p>
              <p className="text-xs text-zinc-500">{contrat.creator.email}</p>
            </div>
          </div>

          {contrat.notes && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Notes internes
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-zinc-800">
                {contrat.notes}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Apercu du contrat
            </h2>
            <p className="text-xs text-zinc-500">
              Telechargez pour une meilleure lisibilite.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <iframe
              src={`/api/contrats/${contrat.id}/pdf`}
              className="h-[720px] w-full bg-white"
              title={`Contrat ${ref}`}
            />
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce contrat ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Seuls les contrats au statut A
              envoyer peuvent etre supprimes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
            >
              Annuler
            </Button>
            <Button
              onClick={deleteContrat}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler ce contrat ?</DialogTitle>
            <DialogDescription>
              Le contrat passera au statut Annule. Il restera consultable
              mais ne pourra plus etre modifie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(false)}
              disabled={busy}
            >
              Retour
            </Button>
            <Button
              onClick={() => changeStatus("annule")}
              disabled={busy}
              className="bg-zinc-700 text-white hover:bg-zinc-800"
            >
              {busy ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
