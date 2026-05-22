"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatFCFA,
  formatMarge,
  getMargeBarColor,
  getMargeColor,
} from "@/lib/comptabilite"
import { downloadCsv } from "@/lib/csv-export"
import { cn } from "@/lib/utils"

type Rentabilite = {
  id: string
  title: string
  client: string
  status: string
  recettes: number
  depenses: number
  benefice: number
  marge: number
}

type SortKey = "title" | "recettes" | "depenses" | "benefice" | "marge"
type SortDir = "asc" | "desc"

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  en_cours: "En cours",
  termine: "Termine",
  annule: "Annule",
  pause: "Pause",
}

export function TableauRentabilite() {
  const [items, setItems] = useState<Rentabilite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("recettes")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch("/api/comptabilite/rentabilite", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Erreur de chargement")
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data?.projets)) {
          setItems(data.projets as Rentabilite[])
        } else {
          setItems([])
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title, "fr")
      else cmp = (a[sortKey] as number) - (b[sortKey] as number)
      return sortDir === "asc" ? cmp : -cmp
    })
    return copy
  }, [items, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  const handleExport = () => {
    const rows: string[][] = [
      [
        "Projet",
        "Client",
        "Statut",
        "Recettes FCFA",
        "Depenses FCFA",
        "Benefice FCFA",
        "Marge %",
      ],
      ...sorted.map((p) => [
        p.title,
        p.client,
        STATUS_LABELS[p.status] ?? p.status,
        String(Math.round(p.recettes)),
        String(Math.round(p.depenses)),
        String(Math.round(p.benefice)),
        p.marge.toFixed(1),
      ]),
    ]
    downloadCsv(
      `rentabilite-${new Date().toISOString().slice(0, 10)}.csv`,
      rows
    )
  }

  const maxMarge = useMemo(
    () =>
      Math.max(
        100,
        ...sorted.map((p) => (Number.isFinite(p.marge) ? p.marge : 0))
      ),
    [sorted]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Recettes (factures payees) et depenses agregees par projet.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={sorted.length === 0}
        >
          <Download className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton
                  label="Projet"
                  active={sortKey === "title"}
                  dir={sortDir}
                  onClick={() => toggleSort("title")}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Recettes"
                  active={sortKey === "recettes"}
                  dir={sortDir}
                  onClick={() => toggleSort("recettes")}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Depenses"
                  active={sortKey === "depenses"}
                  dir={sortDir}
                  onClick={() => toggleSort("depenses")}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Benefice"
                  active={sortKey === "benefice"}
                  dir={sortDir}
                  onClick={() => toggleSort("benefice")}
                  align="right"
                />
              </TableHead>
              <TableHead className="w-[180px]">
                <SortButton
                  label="Marge"
                  active={sortKey === "marge"}
                  dir={sortDir}
                  onClick={() => toggleSort("marge")}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucun projet avec des donnees financieres.
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Un projet apparait ici des qu&apos;il a une facture payee
                    ou une depense.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => {
                const barWidth =
                  maxMarge > 0
                    ? Math.max(
                        0,
                        Math.min(100, (p.marge / maxMarge) * 100)
                      )
                    : 0
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium text-zinc-900">
                      <Link
                        href={`/admin/projets/${p.id}`}
                        className="hover:text-[#C8151B]"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {STATUS_LABELS[p.status] ?? p.status}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {p.client}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-emerald-700">
                      {formatFCFA(p.recettes)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-zinc-700">
                      {formatFCFA(p.depenses)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-sm font-bold",
                        p.benefice >= 0 ? "text-zinc-900" : "text-red-600"
                      )}
                    >
                      {formatFCFA(p.benefice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              getMargeBarColor(p.marge)
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "min-w-[3.5rem] text-right text-xs font-semibold tabular-nums",
                            getMargeColor(p.marge)
                          )}
                        >
                          {formatMarge(p.marge)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-zinc-900",
        align === "right" && "justify-end"
      )}
    >
      {label}
      {!active ? (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      ) : dir === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
    </button>
  )
}
