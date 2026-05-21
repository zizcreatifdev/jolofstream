"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/public/logo"

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

  const transparent = isHome && !scrolled
  const textBase = transparent ? "text-zinc-100" : "text-zinc-600"
  const textHover = transparent ? "hover:text-white" : "hover:text-zinc-900"

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        transparent
          ? "bg-transparent"
          : "border-b border-zinc-100 bg-white/95 shadow-sm backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant="couleur" width={140} height={42} href="/" />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Menu principal">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[15px] font-medium transition-colors",
                  active ? "text-[#C8151B]" : cn(textBase, textHover)
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
            className="hidden rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a01015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8151B] focus-visible:ring-offset-2 md:inline-flex"
          >
            Demander un devis
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors md:hidden",
              transparent
                ? "text-white hover:bg-white/10"
                : "text-zinc-700 hover:bg-zinc-100"
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
            className="border-t border-zinc-100 bg-white shadow-lg md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                      active
                        ? "bg-zinc-50 text-[#C8151B]"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <Link
                href="/contact"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
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
