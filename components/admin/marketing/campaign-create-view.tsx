"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CampaignEditor,
  type CampaignEditorValues,
} from "@/components/admin/marketing/campaign-editor"

export function CampaignCreateView() {
  const router = useRouter()
  const [values, setValues] = useState<CampaignEditorValues>({
    title: "",
    subject: "",
    body: "",
    lists: [],
    templateType: "",
    scheduledAt: "",
  })
  const [saving, setSaving] = useState<"brouillon" | "planifie" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (kind: "brouillon" | "planifie") => {
    setSaving(kind)
    setError(null)
    try {
      const payload = {
        title: values.title,
        subject: values.subject,
        body: values.body,
        lists: values.lists,
        templateType: values.templateType,
        scheduledAt:
          kind === "planifie" && values.scheduledAt
            ? values.scheduledAt
            : "",
        status: kind,
      }
      if (kind === "planifie" && !values.scheduledAt) {
        setError(
          "Renseignez une date d'envoi planifie pour passer en mode Planifie."
        )
        setSaving(null)
        return
      }
      const r = await fetch("/api/marketing/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        const issues = data?.issues
          ? Object.values(data.issues).flat().join(", ")
          : null
        throw new Error(issues || data?.error || "Echec de l'enregistrement")
      }
      const created = await r.json()
      router.push(`/admin/mail-marketing/campagnes/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/mail-marketing"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-[#C8151B]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Nouvelle campagne
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/mail-marketing">
            <Button variant="outline" disabled={saving !== null}>
              Annuler
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => submit("brouillon")}
            disabled={saving !== null}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving === "brouillon"
              ? "Enregistrement..."
              : "Sauvegarder brouillon"}
          </Button>
          <Button
            onClick={() => submit("planifie")}
            disabled={saving !== null}
            className="bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            {saving === "planifie" ? "Planification..." : "Planifier"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <CampaignEditor onChange={setValues} />
    </div>
  )
}
