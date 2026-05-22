"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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

function emptyResume(): Resume {
  return {
    recettes: {
      total: 0,
      ce_mois: 0,
      mois_precedent: 0,
      par_mois: [],
    },
    depenses: {
      total: 0,
      ce_mois: 0,
      par_mois: [],
      par_categorie: [],
    },
    benefice: { total: 0, ce_mois: 0, marge: 0 },
    factures_impayees: { count: 0, total: 0, liste: [] },
  }
}

export function ComptabiliteView() {
  const [resume, setResume] = useState<Resume>(emptyResume())
  const [loadingResume, setLoadingResume] = useState(true)
  const [tab, setTab] = useState<"depenses" | "recettes" | "rentabilite">(
    "depenses"
  )
  const [formOpen, setFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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
            key={`depenses-${refreshKey}`}
            onCreated={handleDepenseCreated}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
          />
        </TabsContent>
        <TabsContent value="recettes" className="mt-4">
          <TableauRecettes key={`recettes-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="rentabilite" className="mt-4">
          <TableauRentabilite key={`renta-${refreshKey}`} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
