"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  parseBadge,
  slideHasVideo,
  slidePosterUrl,
  slideTabLabel,
  splitAccent,
  youtubeBackgroundSrc,
  youtubeThumbnailUrl,
  type HeroSlideView,
} from "@/lib/hero-slides"
import { useAnyDialogOpen, useLowMotionOrData } from "@/lib/use-dialog-a11y"
import { HeroStage } from "@/components/public/hero/hero-stage"
import { HeroPlayer } from "@/components/public/hero/hero-player"

const INTRO_KEY = "js-hero-intro-seen"
// Fondu entre deux slides ; la video sortante est demontee apres
const FADE_MS = 1100
const RISE = [0.2, 0.8, 0.2, 1] as const
const CURTAIN_EASE = [0.7, 0, 0.2, 1] as const

// Execute avant l'affichage : masque le lever de rideau si deja vu dans la
// session ou si l'utilisateur demande moins d'animations (aucun flash noir)
const INTRO_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.heroIntro="off"}}catch(e){document.documentElement.dataset.heroIntro="off"}`

// Hero de repli si aucune slide n'est active
const FALLBACK_SLIDE: HeroSlideView = {
  id: "hero-repli",
  order: 0,
  active: true,
  kicker: "Jolof Stream · Captation et streaming",
  titleLine1: "Capturez l’instant,",
  titleLine2: "diffusez l’émotion.",
  accentText: "diffusez",
  description: "",
  videoType: "NONE",
  youtubeUrl: null,
  youtubeId: null,
  mp4Url: null,
  posterUrl: null,
  cta1Label: "Demander un devis",
  cta1Href: "/contact",
  cta2Label: "Nos services",
  cta2Href: "/services",
  soundLabel: "",
  badgeText: null,
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

type Intro = "pending" | "playing" | "done"

export function HeroCarousel({
  slides: slidesProp,
  duration,
  preview = false,
}: {
  slides: HeroSlideView[]
  duration: number
  // Apercu dans l'admin : cadre fixe, sans rideau ni sessionStorage
  preview?: boolean
}) {
  const slides = slidesProp.length > 0 ? slidesProp : [FALLBACK_SLIDE]
  const count = slides.length
  const multiple = count > 1

  const sectionRef = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [intro, setIntro] = useState<Intro>("pending")
  const [textShown, setTextShown] = useState(true)
  const [tabHidden, setTabHidden] = useState(false)
  const [offscreen, setOffscreen] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [canMountVideo, setCanMountVideo] = useState(false)
  const [mounted, setMounted] = useState<number[]>([])
  const [playerSlide, setPlayerSlide] = useState<HeroSlideView | null>(null)
  const progress = useMotionValue(0)

  const lowMotion = useLowMotionOrData()
  const reduce = Boolean(useReducedMotion())
  const dialogOpen = useAnyDialogOpen()

  const autoplay = multiple && !lowMotion
  const paused =
    !autoplay ||
    dialogOpen ||
    tabHidden ||
    offscreen ||
    keyboardFocus ||
    userPaused ||
    intro === "playing"

  const goTo = useCallback(
    (next: number) => {
      progress.set(0)
      setIndex(((next % count) + count) % count)
    },
    [count, progress]
  )

  // Lever de rideau : premiere visite de la session uniquement
  useIsoLayoutEffect(() => {
    if (preview) {
      setIntro("done")
      return
    }
    let seen = true
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1"
    } catch {
      seen = true
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (seen || reduced) {
      setIntro("done")
      return
    }
    try {
      sessionStorage.setItem(INTRO_KEY, "1")
    } catch {
      // stockage indisponible : le rideau se joue a chaque visite
    }
    setTextShown(false)
    setIntro("playing")
  }, [preview])

  // Sequence du lever de rideau : titres a 1,65 s, fin a 2,6 s
  useEffect(() => {
    if (intro !== "playing") return
    const rise = window.setTimeout(() => setTextShown(true), 1650)
    const done = window.setTimeout(() => setIntro("done"), 2600)
    return () => {
      window.clearTimeout(rise)
      window.clearTimeout(done)
    }
  }, [intro])

  // Videos : jamais avant le premier affichage complet de la page
  useEffect(() => {
    const enable = () => setCanMountVideo(true)
    if (document.readyState === "complete") {
      const timer = window.setTimeout(enable, 300)
      return () => window.clearTimeout(timer)
    }
    window.addEventListener("load", enable, { once: true })
    return () => window.removeEventListener("load", enable)
  }, [])

  // Seule la video de la slide visible est montee ; la precedente est
  // demontee apres le fondu
  useEffect(() => {
    if (!canMountVideo || lowMotion) {
      setMounted([])
      return
    }
    setMounted((prev) => (prev.includes(index) ? prev : [...prev, index]))
    const timer = window.setTimeout(
      () => setMounted((prev) => prev.filter((i) => i === index)),
      FADE_MS
    )
    return () => window.clearTimeout(timer)
  }, [index, canMountVideo, lowMotion])

  // Pause quand l'onglet est masque
  useEffect(() => {
    const update = () => setTabHidden(document.hidden)
    update()
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])

  // Pause quand le hero sort de l'ecran
  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Defilement automatique : la progression reprend la ou elle s'est arretee
  useEffect(() => {
    if (paused) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const next = progress.get() + (now - last) / (duration * 1000)
      last = now
      if (next >= 1) {
        goTo(index + 1)
        return
      }
      progress.set(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [paused, duration, index, goTo, progress])

  // Glisse du doigt sur mobile
  const touchX = useRef<number | null>(null)

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: count - 1,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = ((keys[event.key] % count) + count) % count
    goTo(next)
    const tab = document.getElementById(`hero-tab-${slides[next].id}`)
    tab?.focus()
  }

  const active = slides[index]
  const introPlaying = intro === "playing"
  const showSound = slideHasVideo(active)

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrousel"
      aria-label="Vidéos à la une"
      className={cn(
        "relative overflow-hidden bg-black text-cine-cream",
        preview
          ? "block h-full w-full"
          : "grid min-h-[100svh] min-[761px]:block min-[761px]:h-[100svh] min-[761px]:min-h-[720px]"
      )}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || !multiple) return
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1))
      }}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setKeyboardFocus(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardFocus(false)
      }}
    >
      {!preview && <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />}

      {slides.map((slide, i) => (
        <HeroSlideFrame
          key={slide.id}
          slide={slide}
          position={i}
          total={count}
          isActive={i === index}
          isFirst={i === 0}
          preview={preview}
          textShown={textShown}
          introPlaying={introPlaying}
          animated={!lowMotion}
          showVideo={mounted.includes(i) && slideHasVideo(slide)}
        />
      ))}

      {intro !== "done" && !reduce && !preview && (
        <>
          <motion.div
            aria-hidden="true"
            className="hero-curtain absolute inset-x-0 top-0 z-20 h-1/2 origin-top bg-black"
            initial={false}
            animate={{ scaleY: introPlaying ? 0 : 1 }}
            transition={{ duration: 1.6, delay: 0.3, ease: CURTAIN_EASE }}
          />
          <motion.div
            aria-hidden="true"
            className="hero-curtain absolute inset-x-0 bottom-0 z-20 h-1/2 origin-bottom bg-black"
            initial={false}
            animate={{ scaleY: introPlaying ? 0 : 1 }}
            transition={{ duration: 1.6, delay: 0.3, ease: CURTAIN_EASE }}
          />
          <noscript>
            <style>{".hero-curtain{display:none}"}</style>
          </noscript>
        </>
      )}

      {(multiple || showSound) && (
        <motion.div
          className="absolute inset-x-0 bottom-0 z-[9] flex flex-wrap items-center gap-x-[22px] gap-y-3 px-[clamp(18px,4.5vw,72px)] pb-[22px] min-[761px]:gap-y-4 min-[761px]:pb-[38px]"
          initial={false}
          animate={{ opacity: textShown ? 1 : 0 }}
          transition={{ duration: 1, delay: textShown && introPlaying ? 0.95 : 0 }}
        >
          {multiple && (
            <>
              <span
                aria-live={paused ? "polite" : "off"}
                className="hidden min-w-16 font-mono text-[13px] font-semibold text-cine-cream/65 min-[761px]:inline"
              >
                <span className="sr-only">Slide </span>
                <strong className="text-white">{String(index + 1).padStart(2, "0")}</strong>
                {" / "}
                {String(count).padStart(2, "0")}
              </span>

              <div
                role="tablist"
                aria-label="Choisir la vidéo"
                className="flex max-w-none flex-[1_1_100%] gap-3 min-[761px]:max-w-[620px] min-[761px]:flex-[1_1_380px]"
              >
                {slides.map((slide, i) => (
                  <HeroTab
                    key={slide.id}
                    slide={slide}
                    selected={i === index}
                    progress={progress}
                    filled={i === index && !autoplay}
                    onSelect={() => goTo(i)}
                    onKeyDown={onTabKeyDown}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Slide précédente"
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-cine-cream/10 text-white backdrop-blur-[8px] transition-colors hover:bg-cine-red min-[761px]:h-12 min-[761px]:w-12"
                >
                  <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Slide suivante"
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-cine-cream/10 text-white backdrop-blur-[8px] transition-colors hover:bg-cine-red min-[761px]:h-12 min-[761px]:w-12"
                >
                  <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
                {autoplay && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={
                      userPaused ? "Reprendre le défilement" : "Mettre en pause le défilement"
                    }
                    className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-cine-cream/10 text-white backdrop-blur-[8px] transition-colors hover:bg-cine-red min-[761px]:h-12 min-[761px]:w-12"
                  >
                    {userPaused ? (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {showSound && (
            <button
              type="button"
              onClick={() => setPlayerSlide(active)}
              aria-haspopup="dialog"
              className="ml-auto inline-flex min-h-12 items-center gap-3 rounded-full bg-cine-cream/95 py-0 pl-[7px] pr-4 text-[13px] font-semibold text-cine-bg transition-transform hover:scale-[1.04] min-[761px]:min-h-[52px] min-[761px]:pr-[22px] min-[761px]:text-[14px]"
            >
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-cine-red text-white">
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              </span>
              {active.soundLabel}
            </button>
          )}
        </motion.div>
      )}

      <HeroPlayer slide={playerSlide} onClose={() => setPlayerSlide(null)} />
    </section>
  )
}

function HeroTab({
  slide,
  selected,
  progress,
  filled,
  onSelect,
  onKeyDown,
}: {
  slide: HeroSlideView
  selected: boolean
  progress: MotionValue<number>
  filled: boolean
  onSelect: () => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      id={`hero-tab-${slide.id}`}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={`hero-slide-${slide.id}`}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "flex min-h-12 flex-1 flex-col justify-end gap-2.5 text-left font-mono text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors",
        selected ? "text-white" : "text-cine-cream/65 hover:text-white"
      )}
    >
      <span className="truncate">{slideTabLabel(slide)}</span>
      <span aria-hidden="true" className="block h-[2px] overflow-hidden rounded-[2px] bg-cine-cream/20">
        {selected && (
          <motion.span
            className="block h-full origin-left bg-cine-yellow"
            style={{ scaleX: filled ? 1 : progress }}
          />
        )}
      </span>
    </button>
  )
}

function HeroSlideFrame({
  slide,
  position,
  total,
  isActive,
  isFirst,
  preview,
  textShown,
  introPlaying,
  animated,
  showVideo,
}: {
  slide: HeroSlideView
  position: number
  total: number
  isActive: boolean
  isFirst: boolean
  preview: boolean
  textShown: boolean
  introPlaying: boolean
  animated: boolean
  showVideo: boolean
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const poster = slidePosterUrl(slide)
  const [posterSrc, setPosterSrc] = useState(poster)
  const { before, accent, after } = splitAccent(slide.titleLine2, slide.accentText)
  const badge = parseBadge(slide.badgeText)
  const reveal = isActive && textShown
  // Premier affichage : titres deja en place (rendu serveur). Ensuite, a
  // chaque changement de slide, ils montent ligne par ligne.
  const baseDelay = introPlaying ? 0 : 0.3
  const Title = isFirst && !preview ? "h1" : "h2"

  useEffect(() => setPosterSrc(slidePosterUrl(slide)), [slide])

  // Slides masquees : hors de l'ordre de tabulation et des lecteurs d'ecran
  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    if (isActive) node.removeAttribute("inert")
    else node.setAttribute("inert", "")
  }, [isActive])

  const line = (content: React.ReactNode, lineIndex: number) => (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        className="inline-block"
        initial={false}
        animate={{ y: reveal ? "0%" : "105%" }}
        transition={
          reveal
            ? { duration: 1.1, ease: RISE, delay: baseDelay + lineIndex * 0.18 }
            : { duration: 0 }
        }
      >
        {content}
      </motion.span>
    </span>
  )

  return (
    <motion.div
      ref={frameRef}
      id={`hero-slide-${slide.id}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`${position + 1} sur ${total} : ${slideTabLabel(slide)}`}
      aria-hidden={!isActive}
      className={cn(
        "flex flex-col justify-end",
        preview
          ? "absolute inset-0"
          : "relative pt-[120px] [grid-area:1/1] min-[761px]:absolute min-[761px]:inset-0 min-[761px]:pt-0",
        isActive ? "z-[2]" : "z-[1]"
      )}
      initial={false}
      animate={
        isActive
          ? { opacity: 1, visibility: "visible" as const }
          : { opacity: 0, transitionEnd: { visibility: "hidden" as const } }
      }
      transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
    >
      {posterSrc ? (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
          initial={false}
          animate={
            animated && isActive ? { scale: [1.06, 1.18] } : { scale: 1.06 }
          }
          transition={
            animated && isActive
              ? { duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          <Image
            src={posterSrc}
            alt=""
            fill
            sizes="100vw"
            priority={isFirst && !preview}
            className="object-cover opacity-[0.72]"
            onError={() => {
              // Miniature YouTube haute definition absente : qualite inferieure
              if (slide.youtubeId && posterSrc !== youtubeThumbnailUrl(slide.youtubeId, "hq")) {
                setPosterSrc(youtubeThumbnailUrl(slide.youtubeId, "hq"))
              } else {
                setPosterSrc(null)
              }
            }}
          />
        </motion.div>
      ) : (
        <HeroStage animated={animated && isActive} />
      )}

      {showVideo && <SlideVideo slide={slide} />}

      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] bg-[linear-gradient(to_top,rgba(5,3,3,0.96)_4%,rgba(5,3,3,0.25)_45%,rgba(5,3,3,0.6)_100%)]"
      />

      <div className="relative z-[7] px-[clamp(18px,4.5vw,72px)] pb-[170px]">
        <p className="inline-flex items-center gap-3 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-cine-yellow">
          <BlinkDot animated={animated && isActive} />
          {slide.kicker}
        </p>
        <Title className="mt-[22px] font-display text-[clamp(56px,10.4vw,176px)] font-normal leading-[0.88] tracking-[-0.025em] text-cine-cream">
          {line(slide.titleLine1, 0)}
          {line(
            <>
              {before}
              {accent && <em className="italic text-cine-yellow">{accent}</em>}
              {after}
            </>,
            1
          )}
        </Title>

        <motion.div
          className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-6"
          initial={false}
          animate={{ opacity: reveal ? 1 : 0 }}
          transition={reveal ? { duration: 1, delay: introPlaying ? 0.65 : 0.8 } : { duration: 0 }}
        >
          {(slide.description || badge) && (
            <div className="max-w-[480px] flex-[1_1_340px]">
              {slide.description && (
                <p className="text-[17px] leading-[1.7] text-cine-cream/80">
                  {slide.description}
                </p>
              )}
              {badge && (
                <span className="mt-[22px] inline-flex flex-wrap items-center gap-3 rounded-full bg-[rgba(5,3,3,0.5)] py-2 pl-2 pr-4 text-[14px] text-cine-cream/90 backdrop-blur-[8px]">
                  <b className="rounded-full bg-cine-red px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                    {badge.label}
                  </b>
                  {badge.text && <span>{badge.text}</span>}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <HeroCta href={slide.cta1Href} primary>
              {slide.cta1Label}
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </HeroCta>
            {slide.cta2Label && slide.cta2Href && (
              <HeroCta href={slide.cta2Href}>{slide.cta2Label}</HeroCta>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function HeroCta({
  href,
  primary = false,
  children,
}: {
  href: string
  primary?: boolean
  children: React.ReactNode
}) {
  const className = cn(
    "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-[26px] text-[15px] font-semibold transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5",
    primary
      ? "bg-cine-red text-white hover:bg-cine-red-dark"
      : "text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.3)] hover:bg-cine-cream hover:text-cine-bg"
  )
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} rel="noopener noreferrer">
      {children}
    </a>
  )
}

function BlinkDot({ animated }: { animated: boolean }) {
  return (
    <motion.i
      aria-hidden="true"
      className="block h-2 w-2 rounded-full bg-cine-red"
      initial={false}
      animate={animated ? { opacity: [1, 1, 0.2, 0.2] } : { opacity: 1 }}
      transition={
        animated
          ? { duration: 1.2, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }
          : { duration: 0 }
      }
    />
  )
}

// Video de fond de la slide visible : poster d'abord, video en fondu une
// fois chargee. YouTube recadree en "cover" et agrandie de 20 % pour masquer
// son interface ; aucune interaction possible.
function SlideVideo({ slide }: { slide: HeroSlideView }) {
  const [ready, setReady] = useState(false)
  const title = `${slide.titleLine1} ${slide.titleLine2}`

  if (slide.videoType === "YOUTUBE" && slide.youtubeId) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden [container-type:size]"
      >
        <motion.iframe
          src={youtubeBackgroundSrc(slide.youtubeId)}
          title={title}
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute left-1/2 top-1/2 border-0"
          style={{
            width: "max(100cqw, 177.78cqh)",
            height: "max(100cqh, 56.25cqw)",
            x: "-50%",
            y: "-50%",
            scale: 1.2,
          }}
          initial={false}
          animate={{ opacity: ready ? 0.9 : 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          onLoad={() => window.setTimeout(() => setReady(true), 1200)}
        />
      </div>
    )
  }

  if (slide.videoType === "MP4" && slide.mp4Url) {
    return (
      <motion.video
        aria-hidden="true"
        tabIndex={-1}
        src={slide.mp4Url}
        poster={slide.posterUrl ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
        ref={(node: HTMLVideoElement | null) => {
          // muted doit etre pose en propriete pour autoriser la lecture auto
          if (node && !node.muted) {
            node.muted = true
            node.play().catch(() => undefined)
          }
        }}
        initial={false}
        animate={{ opacity: ready ? 0.9 : 0 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        onCanPlay={() => setReady(true)}
      />
    )
  }

  return null
}
