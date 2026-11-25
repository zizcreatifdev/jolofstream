"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import type { WorkItem } from "@/lib/home-data"
import { Kicker } from "@/components/public/cine/primitives"
import { PortfolioLightbox, type LightboxItem } from "@/components/public/portfolio-lightbox"

const pad = (n: number) => String(n).padStart(2, "0")
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// Realisations : sur bureau, section epinglee dont le defilement vertical fait
// glisser la piste horizontalement (animation-timeline si disponible, sinon
// calcul au defilement). Sur mobile et en mouvement reduit : defilement
// horizontal natif avec scroll-snap, sans epinglage.
export function WorksSection({
  items,
  heading,
}: {
  items: WorkItem[]
  heading: { kicker: string; title: string; accent: string; text: string }
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [pinned, setPinned] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null)
  const metrics = useRef({ distance: 0, top: 0, height: 0 })

  // Epinglage seulement sur grand ecran et sans mouvement reduit
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1000px)")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPinned(wide.matches && !reduce.matches)
    update()
    wide.addEventListener("change", update)
    reduce.addEventListener("change", update)
    return () => {
      wide.removeEventListener("change", update)
      reduce.removeEventListener("change", update)
    }
  }, [])

  // Hauteur de la section = distance horizontale a parcourir + un ecran
  const measure = useCallback(() => {
    const track = trackRef.current
    const section = sectionRef.current
    if (!track || !section) return
    const distance = Math.max(0, track.scrollWidth - window.innerWidth)
    track.style.setProperty("--works-shift", `${-distance}px`)
    setHeight(distance + window.innerHeight)
    metrics.current = {
      distance,
      top: section.getBoundingClientRect().top + window.scrollY,
      height: distance + window.innerHeight,
    }
  }, [])

  useIsoLayoutEffect(() => {
    if (!pinned) {
      setHeight(null)
      if (trackRef.current) trackRef.current.style.transform = ""
      return
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [pinned, measure])

  // Repli sans animation-timeline : position calculee au defilement
  useEffect(() => {
    if (!pinned || CSS.supports("animation-timeline: view()")) return
    let frame = 0
    const update = () => {
      frame = 0
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      const { distance } = metrics.current
      const rect = section.getBoundingClientRect()
      const range = rect.height - window.innerHeight
      const progress = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0
      track.style.transform = `translateX(${-progress * distance}px)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pinned, height])

  // Focus clavier sur une carte hors champ : defilement vertical correspondant
  const onCardFocus = (event: React.FocusEvent<HTMLElement>) => {
    const viewport = viewportRef.current
    if (!pinned || !viewport) return
    viewport.scrollLeft = 0
    const { distance, top, height: total } = metrics.current
    if (distance <= 0) return
    const card = event.currentTarget
    const target = Math.min(distance, Math.max(0, card.offsetLeft - window.innerWidth * 0.2))
    const range = total - window.innerHeight
    window.scrollTo({ top: top + (target / distance) * range, behavior: "auto" })
  }

  return (
    <section
      ref={sectionRef}
      aria-label={heading.kicker || heading.title}
      className={cn("relative bg-cine-bg text-cine-cream", pinned && "works-pinned")}
      style={pinned && height ? { height } : undefined}
    >
      <div
        ref={viewportRef}
        className={cn(
          pinned
            ? "sticky top-0 flex h-screen items-center overflow-hidden"
            : "flex snap-x snap-mandatory items-center overflow-x-auto py-[90px]"
        )}
      >
        <div
          ref={trackRef}
          className="works-track flex w-max items-stretch gap-6 px-[clamp(18px,4.5vw,72px)]"
        >
          <div className="flex w-[84vw] shrink-0 snap-start flex-col justify-end pb-[30px] min-[761px]:w-[420px]">
            {heading.kicker && <Kicker>{heading.kicker}</Kicker>}
            <h2 className="mt-[18px] font-display text-[clamp(44px,6vw,96px)] font-normal leading-[0.94] tracking-[-0.025em]">
              {heading.title}
              {heading.accent && (
                <>
                  {" "}
                  <em className="italic text-cine-yellow">{heading.accent}</em>
                </>
              )}
            </h2>
            {heading.text && (
              <p className="mt-[18px] text-[16px] leading-[1.7] text-cine-cream/70">{heading.text}</p>
            )}
          </div>

          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onFocus={onCardFocus}
              onClick={() =>
                setLightbox({
                  title: item.title,
                  mediaType: item.mediaType,
                  mediaUrl: item.mediaUrl,
                  youtubeId: item.youtubeId,
                })
              }
              className="group relative block h-[520px] w-[84vw] shrink-0 snap-start overflow-hidden rounded-md bg-cine-bg3 text-left text-cine-cream min-[761px]:h-[min(660px,72vh)] min-[761px]:w-[560px]"
            >
              {item.thumbnailUrl && (
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(min-width: 761px) 560px, 84vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
                />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,3,3,0.94)_0%,rgba(5,3,3,0.8)_62%,rgba(5,3,3,0.2)_100%)]"
              />
              <span className="sr-only">Voir : </span>
              <span aria-hidden="true" className="absolute left-6 top-[22px] font-mono text-[13px] font-semibold text-cine-cream/75">
                {pad(i + 1)} / {pad(items.length)}
              </span>
              {item.mediaType === "youtube" && (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cine-cream/95 text-cine-red"
                >
                  <Play className="ml-1 h-[26px] w-[26px] fill-current" />
                </span>
              )}
              <span className="absolute inset-x-[26px] bottom-[26px] block">
                <small className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cine-yellow">
                  {item.typeLabel}
                </small>
                <strong className="mb-2 mt-2.5 block font-display text-[clamp(34px,3.4vw,46px)] font-normal leading-none tracking-[-0.02em]">
                  {item.title}
                </strong>
              </span>
            </button>
          ))}

          <div
            className="flex w-[84vw] shrink-0 snap-start flex-col justify-center gap-6 rounded-md bg-cine-red p-10 min-[761px]:w-[420px]"
          >
            <p className="font-display text-[clamp(40px,4vw,54px)] leading-[0.95] text-white">
              Tout le portfolio
            </p>
            <Link
              href="/portfolio"
              onFocus={onCardFocus}
              className="inline-flex min-h-[52px] items-center self-start rounded-full px-[26px] text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-colors hover:bg-white hover:text-cine-red"
            >
              Ouvrir le portfolio
            </Link>
          </div>
        </div>

        {pinned && (
          <div
            aria-hidden="true"
            className="absolute inset-x-[clamp(18px,4.5vw,72px)] bottom-[60px] h-px bg-cine-cream/[0.12]"
          >
            <span ref={barRef} className="works-bar block h-full origin-left scale-x-0 bg-cine-yellow" />
          </div>
        )}
      </div>

      <PortfolioLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </section>
  )
}
