"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  FileSpreadsheet,
  FileText,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  KpiComptabilite,
  type ComptabiliteKpisData,
} from "@/components/admin/comptabilite/kpi-comptabilite"
import { GraphiqueRevenus } from "@/components/admin/comptabilite/graphique-revenus"
import {
  GraphiqueDepensesCategorie,
  type DepenseCategorie,
} from "@/components/admin/comptabilite/graphique-depenses-categorie"
import { TableauDepenses } from "@/components/admin/comptabilite/tableau-depenses"
import { TableauRecettes } from "@/components/admin/comptabilite/tableau-recettes"
import { TableauRentabilite } from "@/components/admin/comptabilite/tableau-rentabilite"
import { formatFCFA } from "@/lib/comptabilite"

type ImpayeRow = {
  id: string
  reference: string
  client: string
  totalTtc: number
  dueAt: string | null
  joursRetard: number
}

type Resume = ComptabiliteKpisData & {
  recettes: ComptabiliteKpisData["recettes"] & {
    par_mois: Array<{ mois: string; montant: number }>
  }
  depenses: ComptabiliteKpisData["depenses"] & {
    par_mois: Array<{ mois: string; montant: number }>
    par_categorie: DepenseCategorie[]
  }
  factures_impayees: ComptabiliteKpisData["factures_impayees"] & {
    liste: ImpayeRow[]
  }
}

type Periode = "ce_mois" | "mois_prec" | "trimestre" | "annee"

const PERIODE_LABELS: Record<Periode, string> = {
  ce_mois: "Ce mois",
  mois_prec: "Mois precedent",
  trimestre: "Ce trimestre",
  annee: "Cette annee",
}

function computeRange(p: Periode) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  if (p === "ce_mois") {
    return {
      from: new Date(year, month, 1).toISOString(),
      to: new Date(year, month + 1, 1).toISOString(),
      exportYear: year,
      exportMonth: month + 1,
    }
  }
  if (p === "mois_prec") {
    const start = new Date(year, month - 1, 1)
    return {
      from: start.toISOString(),
      to: new Date(year, month, 1).toISOString(),
      exportYear: start.getFullYear(),
      exportMonth: start.getMonth() + 1,
    }
  }
  if (p === "trimestre") {
    const q = Math.floor(month / 3)
    return {
      from: new Date(year, q * 3, 1).toISOString(),
      to: new Date(year, q * 3 + 3, 1).toISOString(),
      exportYear: year,
      exportMonth: null as number | null,
    }
  }
  return {
    from: new Date(year, 0, 1).toISOString(),
    to: new Date(year + 1, 0, 1).toISOString(),
    exportYear: year,
    exportMonth: null as number | null,
  }
}

function emptyResume(): Resume {
  return {
    recettes: { total: 0, ce_mois: 0, mois_precedent: 0, par_mois: [] },
    depenses: { total: 0, ce_mois: 0, par_mois: [], par_categorie: [] },
    benefice: { total: 0, ce_mois: 0, marge: 0 },
    factures_impayees: { count: 0, total: 0, liste: [] },
  }
}

async function downloadFromUrl(url: string, fallbackName: string) {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    let msg = "Echec du telechargement"
    try {
      const j = await response.json()
      if (j?.error) msg = j.error
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  const blob = await response.blob()
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? fallbackName
  const link = document.createElement("a")
  const href = URL.createObjectURL(blob)
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(href)
}

export function ComptabiliteView() {
  const [resume, setResume] = useState<Resume>(emptyResume())
  const [loadingResume, setLoadingResume] = useState(true)
  const [tab, setTab] = useState<"depenses" | "recettes" | "rentabilite">(
    "depenses"
  )
  const [formOpen, setFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [periode, setPeriode] = useState<Periode>("annee")
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [sendingAlerts, setSendingAlerts] = useState(false)
  const [alertResult, setAlertResult] = useState<string | null>(null)

  const periodeRange = useMemo(() => computeRange(periode), [periode])

  const loadResume = useCallback(async () => {
    try {
      const r = await fetch("/api/comptabilite/resume", { cache: "no-store" })
      if (!r.ok) return
      const data = (await r.json()) as Resume
      setResume(data)
    } catch {
      // garder l'etat existant
    } finally {
      setLoadingResume(false)
    }
  }, [])

  useEffect(() => {
    loadResume()
  }, [loadResume, refreshKey])

  useEffect(() => {
    const handler = () => {
      setTab("depenses")
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const handleDepenseCreated = () => {
    setRefreshKey((k) => k + 1)
  }

  const buildExportQuery = () => {
    const params = new URLSearchParams()
    params.set("year", String(periodeRange.exportYear))
    if (periodeRange.exportMonth !== null) {
      params.set("month", String(periodeRange.exportMonth))
    }
    return params.toString()
  }

  const handleExportExcel = async () => {
    setExporting("excel")
    setExportError(null)
    try {
      await downloadFromUrl(
        `/api/comptabilite/export/excel?${buildExportQuery()}`,
        "rapport.xlsx"
      )
    } catch (e) {
      setExportError(
        e instanceof Error ? e.message : "Erreur d'export Excel"
      )
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    setExporting("pdf")
    setExportError(null)
    try {
      await downloadFromUrl(
        `/api/comptabilite/export/pdf?${buildExportQuery()}`,
        "rapport.pdf"
      )
    } catch (e) {
      setExportError(
        e instanceof Error ? e.message : "Erreur d'export PDF"
      )
    } finally {
      setExporting(null)
    }
  }

  const handleSendAlerts = async () => {
    setSendingAlerts(true)
    setAlertResult(null)
    try {
      const r = await fetch("/api/comptabilite/alertes", { method: "POST" })
      if (!r.ok) throw new Error("Echec de l'envoi")
      const data = (await r.json()) as {
        alertes_envoyees: number
        total_factures: number
      }
      setAlertResult(
        `${data.alertes_envoyees} alerte${data.alertes_envoyees > 1 ? "s" : ""} envoyee${data.alertes_envoyees > 1 ? "s" : ""} sur ${data.total_factures} facture${data.total_factures > 1 ? "s" : ""} en retard.`
      )
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setAlertResult(
        e instanceof Error ? e.message : "Erreur lors de l'envoi"
      )
    } finally {
      setSendingAlerts(false)
      setAlertDialogOpen(false)
    }
  }

  const impayesCount = resume.factures_impayees.count

  return (
    <div className="space-y-6">
      {loadingResume ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <KpiComptabilite data={resume} />
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-48">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Periode
            </label>
            <Select
              value={periode}
              onValueChange={(v) => setPeriode(v as Periode)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ce_mois">
                  {PERIODE_LABELS.ce_mois}
                </SelectItem>
                <SelectItem value="mois_prec">
                  {PERIODE_LABELS.mois_prec}
                </SelectItem>
                <SelectItem value="trimestre">
                  {PERIODE_LABELS.trimestre}
                </SelectItem>
                <SelectItem value="annee">
                  {PERIODE_LABELS.annee}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting !== null}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {exporting === "excel" ? "Export..." : "Exporter Excel"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting !== null}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            {exporting === "pdf" ? "Export..." : "Exporter PDF"}
          </Button>
          {impayesCount > 0 && (
            <Button
              size="sm"
              onClick={() => {
                setAlertResult(null)
                setAlertDialogOpen(true)
              }}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              <AlertCircle className="mr-1.5 h-4 w-4" />
              Envoyer alertes impayes ({impayesCount})
            </Button>
          )}
        </div>
      </div>

      {exportError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {exportError}
        </div>
      )}
      {alertResult && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <Bell className="mr-1.5 inline h-4 w-4" />
          {alertResult}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Evolution mensuelle
            </h2>
            <p className="text-xs text-zinc-500">12 derniers mois</p>
          </div>
          {loadingResume ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <GraphiqueRevenus
              recettes={resume.recettes.par_mois}
              depenses={resume.depenses.par_mois}
            />
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Depenses par categorie
            </h2>
          </div>
          {loadingResume ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <GraphiqueDepensesCategorie data={resume.depenses.par_categorie} />
          )}
        </div>
      </div>

      {!loadingResume && resume.factures_impayees.count > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900">
                {resume.factures_impayees.count} facture
                {resume.factures_impayees.count > 1 ? "s" : ""} impayee
                {resume.factures_impayees.count > 1 ? "s" : ""}
                {" - "}
                {formatFCFA(resume.factures_impayees.total)}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {resume.factures_impayees.liste.slice(0, 5).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <Link
                      href={`/admin/devis-factures`}
                      className="truncate font-medium text-orange-900 hover:underline"
                    >
                      {f.reference}
                      <span className="ml-1.5 font-normal text-orange-700">
                        - {f.client}
                      </span>
                    </Link>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      {f.joursRetard > 0 ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
                          {f.joursRetard} jour{f.joursRetard > 1 ? "s" : ""} de
                          retard
                        </span>
                      ) : (
                        <span className="text-orange-700">en attente</span>
                      )}
                      <span className="font-semibold text-orange-900">
                        {formatFCFA(f.totalTtc)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {resume.factures_impayees.liste.length > 5 && (
                <Link
                  href="/admin/devis-factures"
                  className="mt-3 inline-block text-xs font-semibold text-orange-900 underline"
                >
                  Voir les {resume.factures_impayees.liste.length} factures
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as "depenses" | "recettes" | "rentabilite")
        }
      >
        <TabsList className="bg-zinc-100">
          <TabsTrigger value="depenses">Depenses</TabsTrigger>
          <TabsTrigger value="recettes">Recettes</TabsTrigger>
          <TabsTrigger value="rentabilite">Rentabilite par projet</TabsTrigger>
        </TabsList>
        <TabsContent value="depenses" className="mt-4">
          <TableauDepenses
            key={`depenses-${refreshKey}-${periode}`}
            onCreated={handleDepenseCreated}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            range={{ from: periodeRange.from, to: periodeRange.to }}
          />
        </TabsContent>
        <TabsContent value="recettes" className="mt-4">
          <TableauRecettes
            key={`recettes-${refreshKey}-${periode}`}
            range={{ from: periodeRange.from, to: periodeRange.to }}
          />
        </TabsContent>
        <TabsContent value="rentabilite" className="mt-4">
          <TableauRentabilite
            key={`renta-${refreshKey}-${periode}`}
            range={{ from: periodeRange.from, to: periodeRange.to }}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer les alertes impayes ?</DialogTitle>
            <DialogDescription>
              Vous allez envoyer une relance par email a {impayesCount} client
              {impayesCount > 1 ? "s" : ""} ayant des factures en retard de
              paiement. Cette action est journalisee.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlertDialogOpen(false)}
              disabled={sendingAlerts}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendAlerts}
              disabled={sendingAlerts}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {sendingAlerts ? "Envoi..." : "Confirmer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
