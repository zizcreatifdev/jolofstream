"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Download, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DepenseForm } from "@/components/admin/comptabilite/depense-form"
import {
  EXPENSE_CATEGORIES_COLORS,
  EXPENSE_CATEGORIES_LABELS,
  EXPENSE_CATEGORY_KEYS,
  formatFCFA,
} from "@/lib/comptabilite"
import { downloadCsv } from "@/lib/csv-export"
import { cn } from "@/lib/utils"

type Depense = {
  id: string
  category: string
  amount: number
  date: string
  description: string
  project: { id: string; title: string } | null
}

type Range = { from?: string; to?: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const PAGE_SIZE = 20

export function TableauDepenses({
  onCreated,
  formOpen,
  setFormOpen,
  range,
}: {
  onCreated: () => void
  formOpen: boolean
  setFormOpen: (v: boolean) => void
  range: Range
}) {
  const [items, setItems] = useState<Depense[]>([])
  const [loading, setLoading] = useState(true)
  const [appending, setAppending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMontant, setTotalMontant] = useState(0)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchItems = useCallback(
    async (nextPage: number, append = false) => {
      if (append) setAppending(true)
      else setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set("page", String(nextPage))
      params.set("limit", String(PAGE_SIZE))
      if (category) params.set("category", category)
      if (debounced) params.set("search", debounced)
      if (range.from) params.set("dateFrom", range.from)
      if (range.to) params.set("dateTo", range.to)
      try {
        const r = await fetch(`/api/comptabilite/depenses?${params}`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          depenses: Depense[]
          pages: number
          totalMontant: number
        }
        setTotalPages(data.pages)
        setTotalMontant(data.totalMontant)
        setItems((prev) =>
          append ? [...prev, ...data.depenses] : data.depenses
        )
        setPage(nextPage)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
        if (!append) setItems([])
      } finally {
        setLoading(false)
        setAppending(false)
      }
    },
    [category, debounced, range.from, range.to]
  )

  useEffect(() => {
    fetchItems(1, false)
  }, [fetchItems])

  const handleExport = () => {
    const rows: string[][] = [
      ["Date", "Categorie", "Description", "Projet", "Montant FCFA"],
      ...items.map((d) => [
        formatDate(d.date),
        EXPENSE_CATEGORIES_LABELS[d.category] ?? d.category,
        d.description,
        d.project?.title ?? "",
        String(Math.round(d.amount)),
      ]),
    ]
    downloadCsv(`depenses-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recherche
          </label>
          <Input
            placeholder="Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Categorie
          </label>
          <Select
            value={category || "_all"}
            onValueChange={(v) => setCategory(v === "_all" ? "" : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Toutes</SelectItem>
              {EXPENSE_CATEGORY_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {EXPENSE_CATEGORIES_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={items.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter
          </Button>
        </div>
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
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <p className="text-sm text-zinc-600">
                    Aucune depense pour ces filtres.
                  </p>
                  <Button
                    onClick={() => setFormOpen(true)}
                    className="mt-4 bg-[#C8151B] text-white hover:bg-[#a01015]"
                  >
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Ajouter la premiere
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm text-zinc-700">
                    {formatDate(d.date)}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-900">
                    {d.description}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      )}
                      style={{
                        backgroundColor:
                          EXPENSE_CATEGORIES_COLORS[d.category] ?? "#6B7280",
                      }}
                    >
                      {EXPENSE_CATEGORIES_LABELS[d.category] ?? d.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {d.project ? (
                      <Link
                        href={`/admin/projets/${d.project.id}`}
                        className="text-zinc-700 hover:text-[#C8151B]"
                      >
                        {d.project.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-zinc-900">
                    {formatFCFA(d.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <p className="text-zinc-600">
            {items.length} depense{items.length > 1 ? "s" : ""} affichee
            {items.length > 1 ? "s" : ""}
          </p>
          <p className="font-bold text-zinc-900">
            Total : {formatFCFA(totalMontant)}
          </p>
        </div>
      )}

      {!loading && items.length > 0 && page < totalPages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems(page + 1, true)}
            disabled={appending}
          >
            {appending ? (
              "Chargement..."
            ) : (
              <>
                <ChevronRight className="mr-1 h-4 w-4" /> Charger plus
              </>
            )}
          </Button>
        </div>
      )}

      <DepenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => {
          onCreated()
          fetchItems(1, false)
        }}
      />
    </div>
  )
}

// Suppress unused import
void ChevronLeft
