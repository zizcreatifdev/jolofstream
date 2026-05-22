"use client"

import { useEffect, useState, useCallback } from "react"
import { Users } from "lucide-react"

import { LISTES_PREDEFINIES, getListeLabel } from "@/lib/marketing"
import { cn } from "@/lib/utils"

type ListesData = {
  listes: string[]
  counts: Record<string, number>
}

export function ListesSidebar({
  selected,
  onSelect,
  refreshKey = 0,
}: {
  selected: string | null
  onSelect: (l: string | null) => void
  refreshKey?: number
}) {
  const [data, setData] = useState<ListesData>({ listes: [], counts: {} })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/marketing/listes", { cache: "no-store" })
      if (r.ok) {
        const json = (await r.json()) as ListesData
        setData(json)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const predefinies = data.listes.filter((l) =>
    LISTES_PREDEFINIES.includes(l as never)
  )
  const customListes = data.listes
    .filter((l) => !LISTES_PREDEFINIES.includes(l as never))
    .sort((a, b) => a.localeCompare(b))

  const totalActifs = Object.values(data.counts).reduce((s, n) => s + n, 0)

  const renderItem = (l: string | null, label: string, count: number) => {
    const active =
      (l === null && selected === null) || (l !== null && selected === l)
    return (
      <button
        key={l ?? "__all"}
        type="button"
        onClick={() => onSelect(l)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition",
          active
            ? "bg-zinc-900 text-white"
            : "text-zinc-700 hover:bg-zinc-100"
        )}
      >
        <span className="truncate">{label}</span>
        <span
          className={cn(
            "ml-2 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
            active ? "bg-white/15 text-white" : "bg-zinc-200 text-zinc-700"
          )}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <aside className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <Users className="h-3.5 w-3.5" /> Listes
      </div>
      <div className="space-y-1">
        {renderItem(null, "Toutes les listes", totalActifs)}
      </div>

      <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Listes par defaut
      </p>
      <div className="mt-1 space-y-1">
        {LISTES_PREDEFINIES.map((l) =>
          renderItem(l, getListeLabel(l), data.counts[l] ?? 0)
        )}
      </div>

      {customListes.length > 0 && (
        <>
          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Listes personnalisees
          </p>
          <div className="mt-1 space-y-1">
            {customListes.map((l) =>
              renderItem(l, l, data.counts[l] ?? 0)
            )}
          </div>
        </>
      )}

      {!loading &&
        predefinies.length === 0 &&
        customListes.length === 0 &&
        totalActifs === 0 && (
          <p className="mt-4 px-2 text-xs text-zinc-500">
            Aucun contact pour le moment.
          </p>
        )}
    </aside>
  )
}
