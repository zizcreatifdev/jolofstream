"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Calculator,
  GraduationCap,
  Package,
  ImageIcon,
  FileSignature,
  Mail,
  Activity,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/admin/logo"

export type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
      { label: "Projets", href: "/admin/projets", icon: FolderKanban },
      { label: "Clients et CRM", href: "/admin/clients", icon: Users },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Devis et Factures",
        href: "/admin/devis-factures",
        icon: FileText,
      },
      {
        label: "Comptabilite",
        href: "/admin/comptabilite",
        icon: Calculator,
      },
    ],
  },
  {
    title: "Services",
    items: [
      { label: "Formations", href: "/admin/formations", icon: GraduationCap },
      { label: "Catalogue offres", href: "/admin/catalogue", icon: Package },
      { label: "Portfolio", href: "/admin/portfolio", icon: ImageIcon },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Contrats", href: "/admin/contrats", icon: FileSignature },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Mail Marketing", href: "/admin/mail-marketing", icon: Mail },
    ],
  },
  {
    title: "Equipe",
    items: [
      { label: "Calendrier", href: "/admin/calendrier", icon: CalendarDays },
      { label: "Journal d'activite", href: "/admin/journal", icon: Activity },
    ],
  },
]

export function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-colors",
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#C8151B]"
        />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function initialsFrom(
  name: string | null | undefined,
  email: string | null | undefined
) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (first + last).toUpperCase() || "JS"
  }
  if (email) return email[0]!.toUpperCase()
  return "JS"
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const displayName = session?.user?.name ?? null
  const email = session?.user?.email ?? null
  const avatarUrl = session?.user?.image ?? null

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[240px] flex-col border-r border-zinc-800 bg-zinc-900 lg:flex">
      <div className="px-5 py-6">
        <Logo variant="blancJaune" width={130} height={40} href="/admin" />
        <span className="mt-2 block text-xs text-zinc-500">Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-zinc-800 pt-4">
            <div className="space-y-0.5">
              <NavLink
                pathname={pathname}
                item={{
                  label: "Parametres",
                  href: "/admin/parametres",
                  icon: Settings,
                }}
              />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">Deconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName ?? "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-300">
                {initialsFrom(displayName, email)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">
              {displayName ?? "Cofondateur"}
            </p>
            <p className="truncate text-xs text-zinc-500">{email ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
