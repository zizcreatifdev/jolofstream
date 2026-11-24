"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { MAIN_NAV, isNavActive, sceneFor, sceneText } from "@/lib/site-nav"

const LOGO_RATIO = 11236 / 4793

// En-tete global fixe : transparent en haut de l'accueil, fond sombre floute
// des qu'on defile ou sur toute autre page
export function SiteHeader({
  pathname,
  menuOpen,
  onOpenMenu,
}: {
  pathname: string
  menuOpen: boolean
  onOpenMenu: () => void
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const solid = scrolled || pathname !== "/"
  const scene = sceneFor(pathname)

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        solid
          ? "border-cine-cream/[0.07] bg-[rgba(5,3,3,0.84)] backdrop-blur-[14px]"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="flex min-h-[84px] items-center gap-[18px] px-[clamp(18px,4.5vw,72px)]">
        <Link
          href="/"
          aria-label="Jolof Stream, accueil"
          className="flex min-h-[44px] shrink-0 items-center rounded-md"
        >
          <Image
            src="/logos/Logo_JolofStream_blancJaune.png"
            alt=""
            width={Math.round(40 * LOGO_RATIO)}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {scene && (
          <div
            aria-hidden="true"
            className="hidden items-center gap-3 rounded-full bg-cine-cream/[0.05] px-3 py-[7px] font-mono text-[11px] tracking-[0.04em] text-cine-cream/60 min-[1180px]:flex"
          >
            <span className="inline-flex items-center gap-[7px] text-white">
              <RecDot />
              REC
            </span>
            <Timecode />
            <span>{sceneText(scene)}</span>
          </div>
        )}

        <nav
          aria-label="Navigation principale"
          className="ml-auto hidden gap-0.5 min-[1000px]:flex"
        >
          {MAIN_NAV.map((item) => {
            const active = isNavActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-[44px] items-center rounded-full px-[13px] text-[14px] font-medium transition-colors",
                  active
                    ? "text-white after:absolute after:inset-x-[13px] after:bottom-[3px] after:h-[2px] after:rounded-[2px] after:bg-cine-red"
                    : "text-cine-cream/70 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/contact"
          className="ml-auto hidden min-h-[44px] items-center justify-center rounded-full bg-cine-red px-5 text-[15px] font-semibold text-white transition-colors hover:bg-cine-red-dark min-[761px]:inline-flex min-[1000px]:ml-0"
        >
          Demander un devis
        </Link>

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          className="ml-auto inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-cine-cream/10 px-[18px] text-[14px] font-semibold text-cine-cream transition-colors hover:bg-cine-cream/20 min-[761px]:ml-0 min-[1000px]:hidden"
        >
          <span aria-hidden="true" className="flex flex-col gap-1">
            <i className="block h-[1.5px] w-[18px] bg-current" />
            <i className="block h-[1.5px] w-[18px] bg-current" />
          </span>
          Menu
        </button>
      </div>
    </header>
  )
}

// Point rouge clignotant (sans halo)
function RecDot() {
  const reduce = useReducedMotion()
  return (
    <motion.i
      className="block h-[7px] w-[7px] rounded-full bg-[#FF2A2F]"
      animate={reduce ? { opacity: 1 } : { opacity: [1, 1, 0.2, 0.2] }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }
      }
    />
  )
}

const pad = (n: number) => String(n).padStart(2, "0")

// Timecode HH:MM:SS:images (25 images par seconde) sur l'heure locale.
// Ecrit directement dans le DOM pour ne pas relancer le rendu React.
function Timecode() {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const render = () => {
      const now = new Date()
      const frames = reduce ? 0 : Math.floor(now.getMilliseconds() / 40)
      if (ref.current) {
        ref.current.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}:${pad(frames)}`
      }
    }
    render()
    const id = window.setInterval(render, reduce ? 1000 : 40)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <span ref={ref} className="tabular-nums">
      00:00:00:00
    </span>
  )
}
