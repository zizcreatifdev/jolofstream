"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pwa-install-dismissed"
const DISMISS_DAYS = 7
const SHOW_DELAY_MS = 3000

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Deja installe : ne pas afficher
    if (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return
    }

    // Recemment refuse : ne pas afficher
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed) {
        const dismissedDate = new Date(dismissed)
        const daysSince =
          (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        if (Number.isFinite(daysSince) && daysSince < DISMISS_DAYS) return
      }
    } catch {
      // localStorage indisponible
    }

    let timer: number | null = null
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      timer = window.setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } catch {
      // ignore
    } finally {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    } catch {
      // ignore
    }
  }

  if (!showBanner) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#161110] p-4 shadow-2xl md:left-auto md:right-6 md:w-96"
      role="dialog"
      aria-label="Installer Jolof Stream"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C8151B]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <polygon points="5,3 19,12 5,21" fill="#F5B800" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          Installer Jolof Stream
        </p>
        <p className="mt-0.5 text-xs text-white/50">
          Acces rapide depuis votre ecran d&apos;accueil
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg bg-[#C8151B] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#8F0E12]"
        >
          Installer
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-center text-xs text-white/40 transition-colors hover:text-white/70"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
