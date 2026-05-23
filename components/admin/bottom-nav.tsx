"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  initialsFrom,
  isActive,
  navGroups,
  type NavItem,
} from "@/components/admin/sidebar"
import { cn } from "@/lib/utils"

const BOTTOM_ITEMS: Array<{ label: string; href: string; Icon: typeof LayoutDashboard }> = [
  { label: "Accueil", href: "/admin", Icon: LayoutDashboard },
  { label: "Projets", href: "/admin/projets", Icon: FolderKanban },
  { label: "Clients", href: "/admin/clients", Icon: Users },
  { label: "Devis", href: "/admin/devis-factures", Icon: FileText },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const displayName = session?.user?.name ?? null
  const email = session?.user?.email ?? null
  const avatarUrl = session?.user?.image ?? null

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-zinc-800 bg-zinc-900 lg:hidden"
        aria-label="Navigation mobile"
      >
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150",
                active ? "text-[#C8151B]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.Icon className="h-[22px] w-[22px]" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150",
            open ? "text-[#C8151B]" : "text-zinc-500 hover:text-zinc-300"
          )}
          aria-label="Ouvrir le menu"
        >
          {open ? (
            <X className="h-[22px] w-[22px]" />
          ) : (
            <Menu className="h-[22px] w-[22px]" />
          )}
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[85vh] flex-col gap-0 overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-zinc-200"
        >
          <SheetTitle className="sr-only">Navigation complete</SheetTitle>
          <div className="flex justify-center pt-3">
            <span
              aria-hidden
              className="h-1 w-12 rounded-full bg-zinc-700"
            />
          </div>

          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName ?? "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-300">
                    {initialsFrom(displayName, email)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {displayName ?? "Cofondateur"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {email ?? ""}
                </p>
              </div>
            </div>
          </div>

          <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Navigation
          </p>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="space-y-5 pt-2">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <DrawerLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-0.5 border-t border-zinc-800 pt-4">
                <DrawerLink
                  pathname={pathname}
                  onClose={() => setOpen(false)}
                  item={{
                    label: "Parametres",
                    href: "/admin/parametres",
                    icon: Settings,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    signOut({ callbackUrl: "/admin/login" })
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Deconnexion</span>
                </button>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

function DrawerLink({
  item,
  pathname,
  onClose,
}: {
  item: NavItem
  pathname: string
  onClose: () => void
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-4 py-3 text-sm transition-colors",
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}
