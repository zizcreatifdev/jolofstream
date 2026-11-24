"use client"

import { useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"

import { useFocusTrap, useScrollLock } from "@/lib/use-dialog-a11y"
import {
  slidePosterUrl,
  youtubePlayerSrc,
  type HeroSlideView,
} from "@/lib/hero-slides"

// Fenetre plein ecran "Regarder avec le son" : la video de la slide active
// avec le son et les controles. Le lecteur est demonte a la fermeture.
export function HeroPlayer({
  slide,
  onClose,
}: {
  slide: HeroSlideView | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {slide && <PlayerDialog key={slide.id} slide={slide} onClose={onClose} />}
    </AnimatePresence>
  )
}

function PlayerDialog({
  slide,
  onClose,
}: {
  slide: HeroSlideView
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  useFocusTrap(ref, true, onClose)
  useScrollLock(true)

  const title = `${slide.titleLine1} ${slide.titleLine2}`
  const poster = slidePosterUrl(slide) ?? undefined

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur vidéo : ${title}`}
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-auto bg-black/90 p-5 backdrop-blur-[10px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        className="w-full max-w-[1180px]"
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="mb-3.5 flex items-center gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-cine-yellow">
              {slide.kicker}
            </p>
            <p className="mt-1 truncate font-display text-[28px] text-cine-cream">
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le lecteur"
            className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cine-cream/10 text-cine-cream transition-colors hover:bg-cine-red"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-md bg-black">
          {slide.videoType === "YOUTUBE" && slide.youtubeId && (
            <iframe
              src={youtubePlayerSrc(slide.youtubeId)}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          )}
          {slide.videoType === "MP4" && slide.mp4Url && (
            <video
              src={slide.mp4Url}
              poster={poster}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
