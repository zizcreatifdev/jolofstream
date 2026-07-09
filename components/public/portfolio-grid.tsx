"use client"

import { useMemo, useState } from "react"
import { ImageIcon, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  PortfolioLightbox,
  type LightboxItem,
} from "@/components/public/portfolio-lightbox"
import {
  extractYoutubeId,
  youtubeThumbnailHq,
  youtubeThumbnailMax,
} from "@/lib/portfolio"

export type PortfolioItem = {
  id: string
  title: string
  type: "Streaming Live" | "CEO Content" | "Creator Weekend" | "Formations"
  description: string
  mediaType: "photo" | "youtube"
  mediaUrl?: string
  thumbnailUrl?: string | null
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
  const [active, setActive] = useState<LightboxItem | null>(null)

  const filtered = useMemo(() => {
    if (filter === "Tout") return items
    return items.filter((item) => item.type === filter)
  }, [filter, items])

  const openLightbox = (item: PortfolioItem) => {
    if (!item.mediaUrl) return
    setActive({
      title: item.title,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      youtubeId:
        item.mediaType === "youtube"
          ? extractYoutubeId(item.mediaUrl)
          : null,
    })
  }

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

      <div key={filter} className="animate-in fade-in duration-200">
        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-500">
            Aucune realisation dans cette categorie pour le moment.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                onOpen={() => openLightbox(item)}
              />
            ))}
          </div>
        )}
      </div>

      <PortfolioLightbox item={active} onClose={() => setActive(null)} />
    </div>
  )
}

function PortfolioCard({
  item,
  onOpen,
}: {
  item: PortfolioItem
  onOpen: () => void
}) {
  const isYoutube = item.mediaType === "youtube"
  const youtubeId = isYoutube && item.mediaUrl
    ? extractYoutubeId(item.mediaUrl)
    : null
  const hasCustomThumb = Boolean(item.thumbnailUrl)
  const initialSrc = isYoutube
    ? item.thumbnailUrl
      ? item.thumbnailUrl
      : youtubeId
        ? youtubeThumbnailMax(youtubeId)
        : null
    : item.mediaUrl ?? null

  const [thumbSrc, setThumbSrc] = useState<string | null>(initialSrc)
  const [photoError, setPhotoError] = useState(false)

  const clickable = Boolean(item.mediaUrl)

  const handleError = () => {
    if (isYoutube) {
      if (hasCustomThumb && thumbSrc === item.thumbnailUrl && youtubeId) {
        setThumbSrc(youtubeThumbnailMax(youtubeId))
        return
      }
      if (youtubeId && thumbSrc?.includes("maxresdefault")) {
        setThumbSrc(youtubeThumbnailHq(youtubeId))
        return
      }
      setThumbSrc(null)
      return
    }
    setPhotoError(true)
  }

  const showFallback = isYoutube ? !thumbSrc : photoError || !thumbSrc

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!clickable}
      className={cn(
        "group block overflow-hidden rounded-xl border border-zinc-100 bg-white text-left shadow-sm transition-all duration-200",
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
          : "cursor-default"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-zinc-200",
          item.tall ? "h-80" : "h-60"
        )}
      >
        {showFallback ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
            Image a venir
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc ?? ""}
            alt={item.title}
            loading="lazy"
            onError={handleError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        />

        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            typeColor[item.type]
          )}
        >
          {item.type}
        </span>

        {clickable && (
          <>
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm sm:hidden",
                isYoutube
                  ? "bg-[#F5B800]/90 text-zinc-900"
                  : "bg-white/85 text-zinc-900"
              )}
            >
              {isYoutube ? (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </span>
            <span className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full",
                  isYoutube
                    ? "bg-[#F5B800] text-zinc-900"
                    : "bg-white/90 text-zinc-900"
                )}
              >
                {isYoutube ? (
                  <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
              </span>
            </span>
          </>
        )}

        <h3 className="absolute inset-x-0 bottom-0 p-4 text-base font-semibold text-white">
          {item.title}
        </h3>
      </div>

      {item.description && (
        <div className="p-5">
          <p className="text-sm text-zinc-600">{item.description}</p>
        </div>
      )}
    </button>
  )
}
