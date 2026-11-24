"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, useScroll } from "framer-motion"

import { cn } from "@/lib/utils"
import { sceneFor, sceneText } from "@/lib/site-nav"
import type { SiteContact } from "@/lib/site-settings"
import { SiteHeader } from "@/components/public/site/site-header"
import { MenuOverlay } from "@/components/public/site/menu-overlay"

// Duree de chaque moitie de la "coupe de montage" (fermeture puis ouverture)
const CUT_MS = 450
const CUT_EASE = [0.7, 0, 0.2, 1] as const
// Ouverture forcee si la page suivante tarde a s'afficher
const CUT_SAFETY_MS = 6000

type Cut = { phase: "idle" | "closing"; label: string }

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Habillage commun des pages publiques : barre de lecture, en-tete, menu
// plein ecran et transition entre les pages. Les URL restent de vraies
// routes Next.js rendues cote serveur : la transition intercepte seulement
// le clic sur un lien interne pour fermer les bandes avant de naviguer.
export function SiteChrome({
  contact,
  children,
}: {
  contact: SiteContact
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cut, setCut] = useState<Cut>({ phase: "idle", label: "" })
  const pendingRef = useRef<string | null>(null)
  const safetyRef = useRef<number | null>(null)

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Interception des liens internes vers une autre page
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download") || anchor.dataset.noTransition) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
        return
      }
      if (prefersReducedMotion()) return

      event.preventDefault()
      if (pendingRef.current) return

      const href = `${url.pathname}${url.search}${url.hash}`
      const scene = sceneFor(url.pathname)
      pendingRef.current = href
      setCut({ phase: "closing", label: scene ? sceneText(scene) : "" })
      window.setTimeout(() => {
        router.push(href)
        safetyRef.current = window.setTimeout(() => {
          pendingRef.current = null
          setCut((c) => ({ ...c, phase: "idle" }))
        }, CUT_SAFETY_MS)
      }, CUT_MS)
    }
    window.addEventListener("click", onClick, true)
    return () => window.removeEventListener("click", onClick, true)
  }, [router])

  // Nouvelle page affichee : ouverture des bandes
  useEffect(() => {
    setMenuOpen(false)
    if (!pendingRef.current) return
    pendingRef.current = null
    if (safetyRef.current) window.clearTimeout(safetyRef.current)
    const timer = window.setTimeout(
      () => setCut((c) => ({ ...c, phase: "idle" })),
      120
    )
    return () => window.clearTimeout(timer)
  }, [pathname])

  const closing = cut.phase === "closing"

  return (
    <>
      <a
        href="#contenu"
        className="fixed left-4 top-4 z-[150] -translate-y-24 rounded-full bg-cine-cream px-5 py-3 text-sm font-semibold text-cine-ink focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <ReadingProgress />
      <SiteHeader
        pathname={pathname}
        menuOpen={menuOpen}
        onOpenMenu={openMenu}
      />
      {children}
      <MenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        pathname={pathname}
        contact={contact}
      />

      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[140]",
          closing ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-[50.5%] origin-top bg-black"
          initial={false}
          animate={{ scaleY: closing ? 1 : 0 }}
          transition={{ duration: CUT_MS / 1000, ease: CUT_EASE }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[50.5%] origin-bottom bg-black"
          initial={false}
          animate={{ scaleY: closing ? 1 : 0 }}
          transition={{ duration: CUT_MS / 1000, ease: CUT_EASE }}
        />
        <motion.p
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[13px] font-semibold tracking-[0.24em] text-cine-yellow"
          initial={false}
          animate={{ opacity: closing ? 1 : 0 }}
          transition={{ duration: 0.2, delay: closing ? 0.25 : 0 }}
        >
          <span className="mr-3 inline-block h-2 w-2 rounded-full bg-cine-red align-middle" />
          {cut.label}
        </motion.p>
      </div>
    </>
  )
}

// Barre de progression de lecture : 2 px, rouge uni, en haut de l'ecran
function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[2px] origin-left bg-cine-red"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
