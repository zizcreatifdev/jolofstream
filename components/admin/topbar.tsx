"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { NotificationsBell } from "@/components/admin/notifications-bell"

type RouteMeta = {
  title: string
  actionLabel?: string
}

const routeMeta: Record<string, RouteMeta> = {
  "/admin": { title: "Vue d'ensemble" },
  "/admin/projets": { title: "Projets", actionLabel: "Nouveau projet" },
  "/admin/clients": { title: "Clients et CRM", actionLabel: "Nouveau client" },
  "/admin/devis-factures": {
    title: "Devis et Factures",
    actionLabel: "Nouveau devis",
  },
  "/admin/comptabilite": {
    title: "Comptabilite",
    actionLabel: "Ajouter une depense",
  },
  "/admin/formations": {
    title: "Formations",
    actionLabel: "Nouvelle session",
  },
  "/admin/catalogue": {
    title: "Catalogue offres",
    actionLabel: "Nouvelle offre",
  },
  "/admin/portfolio": {
    title: "Portfolio",
    actionLabel: "Ajouter une realisation",
  },
  "/admin/contrats": {
    title: "Contrats",
    actionLabel: "Nouveau contrat",
  },
  "/admin/mail-marketing": {
    title: "Mail Marketing",
    actionLabel: "Nouveau contact",
  },
  "/admin/calendrier": { title: "Calendrier" },
  "/admin/journal": { title: "Journal d'activite" },
  "/admin/parametres": { title: "Parametres" },
}

function resolveMeta(pathname: string): RouteMeta {
  if (routeMeta[pathname]) return routeMeta[pathname]
  const matched = Object.keys(routeMeta)
    .filter((key) => key !== "/admin" && pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0]
  if (matched) return routeMeta[matched]
  return { title: "Admin" }
}


export function Topbar() {
  const pathname = usePathname()
  const meta = resolveMeta(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-zinc-900">
          {meta.title}
        </h1>
        <nav className="mt-0.5 text-sm text-zinc-500" aria-label="Fil d'Ariane">
          <Link href="/admin" className="hover:text-zinc-700">
            Admin
          </Link>
          {pathname !== "/admin" && (
            <>
              <span className="px-1.5">/</span>
              <span className="text-zinc-600">{meta.title}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {meta.actionLabel && (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("admin:primary-action", {
                  detail: { pathname },
                })
              )
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#C8151B] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#a01015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8151B] focus-visible:ring-offset-2"
          >
            <PlusCircle className="h-4 w-4" />
            {meta.actionLabel}
          </button>
        )}

        <NotificationsBell />
      </div>
    </header>
  )
}
