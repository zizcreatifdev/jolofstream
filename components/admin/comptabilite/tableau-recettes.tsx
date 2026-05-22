"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { formatFCFA } from "@/lib/comptabilite"
import { downloadCsv } from "@/lib/csv-export"

type Recette = {
  id: string
  reference: string
  totalTtc: number
  paidAt: string | null
  issuedAt: string | null
  client: { id: string; name: string } | null
  project: { id: string; title: string } | null
}

type ClientOption = { id: string; name: string }

type Range = { from?: string; to?: string }

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

const PAGE_SIZE = 20

export function TableauRecettes({ range }: { range: Range }) {
  const [items, setItems] = useState<Recette[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [appending, setAppending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMontant, setTotalMontant] = useState(0)
  const [clientId, setClientId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/clients", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(
            (data as Array<{ id: string; name: string }>).map((c) => ({
              id: c.id,
              name: c.name,
            }))
          )
        }
      })
      .catch(() => setClients([]))
  }, [])

  const fetchItems = useCallback(
    async (nextPage: number, append = false) => {
      if (append) setAppending(true)
      else setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set("page", String(nextPage))
      params.set("limit", String(PAGE_SIZE))
      if (clientId) params.set("clientId", clientId)
      if (range.from) params.set("dateFrom", range.from)
      if (range.to) params.set("dateTo", range.to)
      try {
        const r = await fetch(`/api/comptabilite/recettes?${params}`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          recettes: Recette[]
          pages: number
          totalMontant: number
        }
        setTotalPages(data.pages)
        setTotalMontant(data.totalMontant)
        setItems((prev) =>
          append ? [...prev, ...data.recettes] : data.recettes
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
    [clientId, range.from, range.to]
  )

  useEffect(() => {
    fetchItems(1, false)
  }, [fetchItems])

  const handleExport = () => {
    const rows: string[][] = [
      ["Date paiement", "Reference", "Client", "Projet", "Montant FCFA"],
      ...items.map((r) => [
        formatDate(r.paidAt),
        r.reference,
        r.client?.name ?? "",
        r.project?.title ?? "",
        String(Math.round(r.totalTtc)),
      ]),
    ]
    downloadCsv(`recettes-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Client
          </label>
          <Select
            value={clientId || "_all"}
            onValueChange={(v) => setClientId(v === "_all" ? "" : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
              <TableHead>Date paiement</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
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
                    Aucune recette pour ces filtres.
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Les recettes correspondent aux factures payees.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm text-zinc-700">
                    {formatDate(r.paidAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-zinc-900">
                    {r.reference}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {r.client?.name ?? (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {r.project ? (
                      <Link
                        href={`/admin/projets/${r.project.id}`}
                        className="text-zinc-700 hover:text-[#C8151B]"
                      >
                        {r.project.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-700">
                    {formatFCFA(r.totalTtc)}
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
            {items.length} recette{items.length > 1 ? "s" : ""} affichee
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
    </div>
  )
}
