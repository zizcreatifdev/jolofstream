"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Play, X } from "lucide-react"

import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Formations", href: "/formations" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "A propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Dark navbar quand on est sur la home et pas encore scrolle
  const isDark = isHome && !scrolled

  const headerClasses = isDark
    ? "bg-transparent"
    : isHome
      ? "bg-[rgba(16,10,9,0.88)] backdrop-blur-xl border-b border-white/[0.06]"
      : "bg-[rgba(250,248,245,0.92)] backdrop-blur-xl border-b border-[var(--jolof-border)]"

  const linkClasses = isDark || isHome
    ? "text-white/55 hover:text-white hover:bg-white/[0.08]"
    : "text-ink-3 hover:text-ink hover:bg-cream-2"

  const linkActive = isDark || isHome
    ? "text-white bg-white/[0.08]"
    : "text-ink bg-cream-2"

  const logoText = isDark || isHome ? "text-white" : "text-ink"
  const burgerColor =
    isDark || isHome
      ? "text-white hover:bg-white/10"
      : "text-ink hover:bg-cream-2"

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        headerClasses
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Jolof Stream"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C8151B] shadow-sm"
            aria-hidden
          >
            <Play className="h-4 w-4 fill-white stroke-white" strokeWidth={1.5} />
          </span>
          <span
            className={cn(
              "font-display text-xl tracking-snug transition-colors",
              logoText
            )}
          >
            Jolof Stream
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  active ? linkActive : linkClasses
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#8F0E12] hover:shadow-[0_8px_24px_rgba(200,21,27,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8151B] focus-visible:ring-offset-2 md:inline-flex"
          >
            Demander un devis
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden",
              burgerColor
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className={cn(
              "border-t backdrop-blur-xl md:hidden",
              isDark || isHome
                ? "border-white/[0.06] bg-[rgba(16,10,9,0.95)]"
                : "border-[var(--jolof-border)] bg-cream"
            )}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-6">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3.5 py-2.5 text-base font-medium transition-all duration-150",
                      active ? linkActive : linkClasses
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#8F0E12]"
              >
                Demander un devis
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
