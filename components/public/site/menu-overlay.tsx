"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { MENU_NAV, isNavActive } from "@/lib/site-nav"
import type { SiteContact } from "@/lib/site-settings"
import { useFocusTrap, useScrollLock } from "@/lib/use-dialog-a11y"

const LOGO_RATIO = 11236 / 4793
const EASE = [0.7, 0, 0.2, 1] as const
const RISE = [0.2, 0.8, 0.2, 1] as const

// Menu plein ecran : ouverture en volet, liens geants numerotes
export function MenuOverlay({
  open,
  onClose,
  pathname,
  contact,
}: {
  open: boolean
  onClose: () => void
  pathname: string
  contact: SiteContact
}) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <MenuPanel
          onClose={onClose}
          pathname={pathname}
          contact={contact}
          reduce={Boolean(reduce)}
        />
      )}
    </AnimatePresence>
  )
}

function MenuPanel({
  onClose,
  pathname,
  contact,
  reduce,
}: {
  onClose: () => void
  pathname: string
  contact: SiteContact
  reduce: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true, onClose)
  useScrollLock(true)

  return (
    <motion.div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[120] flex flex-col overflow-auto bg-cine-bg text-cine-cream"
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
      exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
    >
      <div className="flex min-h-[84px] items-center px-[clamp(18px,4.5vw,72px)]">
        <Link
          href="/"
          onClick={onClose}
          aria-label="Jolof Stream, accueil"
          className="flex min-h-[44px] items-center rounded-md"
        >
          <Image
            src="/logos/Logo_JolofStream_blancJaune.png"
            alt=""
            width={Math.round(40 * LOGO_RATIO)}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          className="ml-auto flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cine-cream/[0.08] transition-colors hover:bg-cine-red"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label="Navigation"
        className="flex flex-1 flex-col justify-center gap-0.5 px-[clamp(18px,4.5vw,72px)] py-6"
      >
        {MENU_NAV.map((item, index) => {
          const active = isNavActive(pathname, item.href)
          return (
            <motion.div
              key={item.href}
              initial={reduce ? false : { opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: RISE, delay: reduce ? 0 : 0.05 * index }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-baseline gap-[22px] font-display text-[clamp(42px,7vw,100px)] leading-[1.04] tracking-[-0.02em] transition-colors",
                  active ? "text-white" : "text-cine-cream/50 hover:text-white"
                )}
              >
                {/* Numero decoratif : le libelle du lien porte l'information */}
                <small
                  aria-hidden="true"
                  className="font-mono text-[13px] font-semibold tracking-[0.1em] text-cine-red"
                >
                  {item.number}
                </small>
                <span className="transition-transform duration-300 group-hover:translate-x-3.5">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="flex flex-wrap justify-between gap-6 px-[clamp(18px,4.5vw,72px)] pb-7 text-[14px] text-cine-cream/70">
        {contact.phone && (
          <a href={`tel:${contact.phoneHref}`} className="inline-flex min-h-[44px] items-center text-cine-cream hover:text-white">
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="inline-flex min-h-[44px] items-center text-cine-cream hover:text-white">
            {contact.email}
          </a>
        )}
        {contact.address && (
          <span className="inline-flex min-h-[44px] items-center">{contact.address}</span>
        )}
      </div>
    </motion.div>
  )
}
