"use client"

import { useMemo, useState } from "react"
import { ExternalLink, ImageIcon, Play } from "lucide-react"

import { cn } from "@/lib/utils"

export type PortfolioItem = {
  id: string
  title: string
  type: "Streaming Live" | "CEO Content" | "Creator Weekend" | "Formations"
  description: string
  youtubeUrl?: string
  tall?: boolean
}

const filters = [
  "Tout",
  "Streaming Live",
  "CEO Content",
  "Creator Weekend",
  "Formations",
] as const

type Filter = (typeof filters)[number]

const typeColor: Record<PortfolioItem["type"], string> = {
  "Streaming Live": "bg-[#C8151B] text-white",
  "CEO Content": "bg-zinc-900 text-white",
  "Creator Weekend": "bg-[#F5B800] text-zinc-900",
  Formations: "bg-emerald-600 text-white",
}

export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [filter, setFilter] = useState<Filter>("Tout")

  const filtered = useMemo(() => {
    if (filter === "Tout") return items
    return items.filter((item) => item.type === filter)
  }, [filter, items])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
              f === filter
                ? "bg-[#C8151B] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-zinc-500">
          Aucune realisation dans cette categorie pour le moment.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isYoutube = Boolean(item.youtubeUrl)
            const Tag = isYoutube ? "a" : "div"
            const tagProps = isYoutube
              ? {
                  href: item.youtubeUrl!,
                  target: "_blank",
                  rel: "noreferrer noopener",
                }
              : {}
            return (
              <Tag
                key={item.id}
                {...tagProps}
                className={cn(
                  "group block overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md",
                  isYoutube && "cursor-pointer"
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "relative flex w-full items-center justify-center bg-zinc-200 text-xs uppercase tracking-wider text-zinc-400",
                    item.tall ? "h-80" : "h-60"
                  )}
                >
                  <span>Image a venir</span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    {isYoutube ? (
                      <Play className="h-10 w-10 text-white" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-white" />
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                        typeColor[item.type]
                      )}
                    >
                      {item.type}
                    </span>
                    {isYoutube && (
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {item.description}
                  </p>
                </div>
              </Tag>
            )
          })}
        </div>
      )}
    </div>
  )
}
