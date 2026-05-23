import type { Metadata } from "next"
import Link from "next/link"

import { ReloadButton } from "./reload-button"

export const metadata: Metadata = {
  title: "Hors ligne",
  description: "Vous etes actuellement hors ligne.",
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#161110] px-6 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
        <h1 className="mb-3 font-display text-3xl font-normal tracking-tight text-white">
          Vous etes hors ligne
        </h1>
        <p className="max-w-sm text-base font-light leading-relaxed text-white/50">
          Verifiez votre connexion internet et reessayez. Certaines pages
          sont disponibles en mode hors ligne.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <ReloadButton />
        <Link
          href="/"
          className="rounded-[10px] border border-white/20 px-6 py-3 font-medium text-white transition-colors duration-150 hover:bg-white/10"
        >
          Page d&apos;accueil
        </Link>
      </div>
      <div className="mt-12">
        <span className="font-display text-lg text-white/20">
          Jolof <span className="text-[#C8151B]/50">Stream</span>
        </span>
      </div>
    </div>
  )
}

