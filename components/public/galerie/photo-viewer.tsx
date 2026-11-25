"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { useFocusTrap, useScrollLock } from "@/lib/use-dialog-a11y"
import type { PublicPhoto } from "@/lib/gallery-public"

// Visionneuse plein écran d'un album : grande taille, précédent et suivant
// (boutons, flèches du clavier, glissement du doigt), compteur, légende,
// Échap pour fermer, piège de focus et retour du focus (hook commun),
// préchargement de la photo suivante. Pas de téléchargement.
export function PhotoViewer({
  photos,
  index,
  albumTitle,
  onChange,
  onClose,
}: {
  photos: PublicPhoto[]
  index: number | null
  albumTitle: string
  onChange: (index: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const open = index !== null
  useFocusTrap(ref, open, onClose)
  useScrollLock(open)
  const [loaded, setLoaded] = useState<string | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const count = photos.length

  const go = (delta: number) => {
    if (index === null) return
    onChange((index + delta + count) % count)
  }

  // Flèches gauche et droite
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        go(1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        go(-1)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  // Préchargement de la photo suivante (et de la précédente)
  useEffect(() => {
    if (index === null || count < 2) return
    for (const i of [(index + 1) % count, (index - 1 + count) % count]) {
      const img = new Image()
      img.decoding = "async"
      img.src = photos[i].url
    }
  }, [index, count, photos])

  if (index === null) return null
  const photo = photos[index]

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${albumTitle} : photo ${index + 1} sur ${count}`}
      className="fixed inset-0 z-[120] flex flex-col bg-black text-cine-cream"
      onTouchStart={(e) => {
        const t = e.touches[0]
        touch.current = { x: t.clientX, y: t.clientY }
      }}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (!start) return
        const t = e.changedTouches[0]
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 min-[761px]:px-6">
        <p aria-live="polite" className="font-mono text-[13px] font-semibold tracking-[0.08em] text-cine-cream/80">
          {index + 1} / {count}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la visionneuse"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 min-[761px]:px-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          onLoad={() => setLoaded(photo.id)}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain transition-opacity duration-200 motion-reduce:transition-none"
          style={{ opacity: loaded === photo.id ? 1 : 0.35 }}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Photo précédente"
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-white hover:text-black min-[761px]:left-5"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Photo suivante"
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-white hover:text-black min-[761px]:right-5"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-[56px] px-4 pb-5 pt-3 text-center min-[761px]:px-6">
        {photo.caption && <p className="mx-auto max-w-[760px] text-[15px] leading-[1.6] text-cine-cream/85">{photo.caption}</p>}
      </div>
    </div>
  )
}
