"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

export type LightboxItem = {
  title: string
  mediaType: "photo" | "youtube"
  mediaUrl: string
  youtubeId?: string | null
}

export function PortfolioLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [item, onClose])

  if (!item) return null

  const isYoutube = item.mediaType === "youtube" && item.youtubeId

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[900px]"
      >
        {isYoutube ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
              title={item.title}
              allow="accelerated-download; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-black shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="mx-auto max-h-[85vh] w-auto object-contain"
            />
          </div>
        )}
        <p className="mt-3 text-center text-sm font-medium text-white/80">
          {item.title}
        </p>
      </div>
    </div>
  )
}
