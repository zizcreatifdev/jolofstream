"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Mail,
  Save,
  Send,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CampaignEditor,
  type CampaignEditorValues,
} from "@/components/admin/marketing/campaign-editor"
import { CampaignStatsDashboard } from "@/components/admin/marketing/campaign-stats-dashboard"
import {
  CAMPAIGN_STATUSES,
  type CampaignStatus,
} from "@/lib/campaign-templates"
import { cn } from "@/lib/utils"

type Campagne = {
  id: string
  title: string
  subject: string
  body: string
  lists: string[]
  status: CampaignStatus
  templateType: string | null
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  creator: { firstName: string; lastName: string; email: string } | null
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function isoToInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function CampaignDetailView({ id }: { id: string }) {
  const [campagne, setCampagne] = useState<Campagne | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [editorValues, setEditorValues] =
    useState<CampaignEditorValues | null>(null)
  const [busy, setBusy] = useState<
    "save" | "plan" | "cancel" | "send" | "test" | null
  >(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [destinatairesCount, setDestinatairesCount] = useState<number | null>(
    null
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const campRes = await fetch(`/api/marketing/campagnes/${id}`, {
        cache: "no-store",
      })
      if (!campRes.ok) throw new Error("Campagne introuvable")
      const data = (await campRes.json()) as Campagne
      setCampagne(data)
      try {
        const sr = await fetch(`/api/marketing/campagnes/${id}/stats`, {
          cache: "no-store",
        })
        if (sr.ok) {
          const stats = (await sr.json()) as { destinataires?: number }
          setDestinatairesCount(stats.destinataires ?? 0)
        }
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get("send") === "1") {
      setConfirmSend(true)
    }
  }, [searchParams])

  const handleSendTest = async () => {
    if (!campagne || !testEmail) return
    setBusy("test")
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(`/api/marketing/campagnes/${campagne.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = (await r.json().catch(() => null)) as
        | { success?: boolean; email?: string; error?: string }
        | null
      if (!r.ok || !data?.success) {
        throw new Error(data?.error || "Echec du test")
      }
      setInfo(`Email de test envoye a ${data.email}.`)
      setTestOpen(false)
      setTestEmail("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(null)
    }
  }

  const handleSendCampaign = async () => {
    if (!campagne) return
    setBusy("send")
    setError(null)
    setInfo(null)
    try {
      const r = await fetch(
        `/api/marketing/campagnes/${campagne.id}/envoyer`,
        { method: "POST" }
      )
      const data = (await r.json().catch(() => null)) as
        | {
            success?: boolean
            destinataires?: number
            envoyes?: number
            erreurs?: number
            error?: string
          }
        | null
      if (!r.ok || !data?.success) {
        throw new Error(data?.error || "Echec de l'envoi")
      }
      setInfo(
        `Campagne envoyee : ${data.envoyes} email${(data.envoyes ?? 0) > 1 ? "s" : ""} delivre${(data.envoyes ?? 0) > 1 ? "s" : ""} sur ${data.destinataires} destinataire${(data.destinataires ?? 0) > 1 ? "s" : ""}${(data.erreurs ?? 0) > 0 ? ` (${data.erreurs} echec${(data.erreurs ?? 0) > 1 ? "s" : ""})` : ""}.`
      )
      setConfirmSend(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(null)
    }
  }

  const patch = async (
    kind: "save" | "plan" | "cancel",
    status?: CampaignStatus
  ) => {
    if (!campagne) return
    setBusy(kind)
    setError(null)
    setInfo(null)
    try {
      const body: Record<string, unknown> = {}
      if (editorValues && (kind === "save" || kind === "plan")) {
        body.title = editorValues.title
        body.subject = editorValues.subject
        body.body = editorValues.body
        body.lists = editorValues.lists
        body.templateType = editorValues.templateType || null
        body.scheduledAt =
          kind === "plan" && editorValues.scheduledAt
            ? editorValues.scheduledAt
            : null
      }
      if (kind === "plan") {
        if (!editorValues?.scheduledAt) {
          setError("Renseignez une date d'envoi planifie.")
          setBusy(null)
          return
        }
        body.status = "planifie"
      }
      if (kind === "cancel" && status) body.status = status

      const r = await fetch(`/api/marketing/campagnes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        const issues = data?.issues
          ? Object.values(data.issues).flat().join(", ")
          : null
        throw new Error(issues || data?.error || "Echec de la mise a jour")
      }
      if (kind === "save") setInfo("Brouillon enregistre.")
      if (kind === "plan") setInfo("Campagne planifiee.")
      if (kind === "cancel") setInfo("Campagne annulee.")
      setConfirmCancel(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        Chargement...
      </div>
    )
  }

  if (!campagne) {
    return (
      <div className="space-y-3">
        <Link
          href="/admin/mail-marketing"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-[#C8151B]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Campagne introuvable."}
        </div>
      </div>
    )
  }

  const statusMeta = CAMPAIGN_STATUSES[campagne.status]
  const isDraft = campagne.status === "brouillon"
  const canCancel =
    campagne.status === "brouillon" || campagne.status === "planifie"
  const isSent = campagne.status === "envoye"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/mail-marketing"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-[#C8151B]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            {campagne.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusMeta?.color ?? "bg-zinc-100 text-zinc-600"
              )}
            >
              {statusMeta?.label ?? campagne.status}
            </span>
            <span className="text-xs text-zinc-500">
              Cree le {formatDateTime(campagne.createdAt)}
              {campagne.sentAt
                ? ` - envoye le ${formatDateTime(campagne.sentAt)}`
                : campagne.scheduledAt
                  ? ` - planifie le ${formatDateTime(campagne.scheduledAt)}`
                  : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(isDraft || campagne.status === "planifie") && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setTestEmail("")
                  setTestOpen(true)
                }}
                disabled={busy !== null}
              >
                <Mail className="mr-1.5 h-4 w-4" /> Envoyer un test
              </Button>
              <Button
                onClick={() => setConfirmSend(true)}
                disabled={busy !== null}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Send className="mr-1.5 h-4 w-4" />
                {busy === "send" ? "Envoi..." : "Envoyer la campagne"}
              </Button>
            </>
          )}
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={() => patch("save")}
                disabled={busy !== null}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {busy === "save" ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                onClick={() => patch("plan")}
                disabled={busy !== null}
                className="bg-[#C8151B] text-white hover:bg-[#a01015]"
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                {busy === "plan" ? "Planification..." : "Planifier"}
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(true)}
              disabled={busy !== null}
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Annuler
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

      {(isSent || campagne.status === "planifie") && (
        <CampaignStatsDashboard id={campagne.id} />
      )}

      <CampaignEditor
        readOnly={!isDraft}
        initial={{
          title: campagne.title,
          subject: campagne.subject,
          body: campagne.body,
          lists: campagne.lists,
          templateType: campagne.templateType ?? "",
          scheduledAt: isoToInputValue(campagne.scheduledAt),
        }}
        onChange={isDraft ? setEditorValues : undefined}
      />

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un email de test</DialogTitle>
            <DialogDescription>
              Le message sera envoye uniquement a cette adresse pour
              previsualisation. Le statut de la campagne et les statistiques
              ne sont pas affectes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="test-email">Email de test</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="vous@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestOpen(false)}
              disabled={busy !== null}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={busy !== null || !testEmail}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {busy === "test" ? "Envoi..." : "Envoyer le test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSend} onOpenChange={setConfirmSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer la campagne ?</DialogTitle>
            <DialogDescription>
              Vous allez envoyer cette campagne a{" "}
              <strong>
                {destinatairesCount ?? 0} contact
                {(destinatairesCount ?? 0) > 1 ? "s" : ""}
              </strong>
              . Cette action est irreversible et les contacts recevront
              immediatement leur email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSend(false)}
              disabled={busy !== null}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendCampaign}
              disabled={
                busy !== null ||
                destinatairesCount === null ||
                destinatairesCount === 0
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busy === "send" ? "Envoi..." : "Confirmer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler cette campagne ?</DialogTitle>
            <DialogDescription>
              La campagne passera au statut Annule. Elle restera consultable
              mais ne pourra plus etre modifiee.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(false)}
              disabled={busy !== null}
            >
              Retour
            </Button>
            <Button
              onClick={() => patch("cancel", "annule")}
              disabled={busy !== null}
              className="bg-zinc-700 text-white hover:bg-zinc-800"
            >
              {busy === "cancel" ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

