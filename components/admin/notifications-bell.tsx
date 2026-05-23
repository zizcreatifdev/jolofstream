"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckSquare,
  CreditCard,
  FileCheck,
  UserPlus,
} from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  entityUrl: string | null
  read: boolean
  createdAt: string
}

const POLL_MS = 30_000
const LIMIT = 5

const ICONS: Record<string, typeof Bell> = {
  nouveau_lead: UserPlus,
  nouvelle_inscription: UserPlus,
  paiement_confirme: CreditCard,
  facture_impayee: AlertCircle,
  contrat_signe: FileCheck,
  tache_assignee: CheckSquare,
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return "a l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.round(h / 24)
  if (j < 7) return `il y a ${j} j`
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/notifications?read=false&limit=${LIMIT}`, {
        cache: "no-store",
      })
      if (!r.ok) return
      const data = (await r.json()) as {
        notifications: Notification[]
        unread_count: number
      }
      setItems(data.notifications)
      setUnread(data.unread_count)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
  }, [load])

  // Recharge a l'ouverture du popover
  useEffect(() => {
    if (open) load()
  }, [open, load])

  const markRead = async (n: Notification) => {
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
    } catch {
      // ignore
    }
    setUnread((c) => Math.max(0, c - (n.read ? 0 : 1)))
    setItems((prev) => prev.filter((x) => x.id !== n.id))
  }

  const markAll = async () => {
    setMarking(true)
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setItems([])
      setUnread(0)
    } catch {
      // ignore
    } finally {
      setMarking(false)
    }
  }

  const handleClick = async (n: Notification) => {
    await markRead(n)
    setOpen(false)
    if (n.entityUrl) router.push(n.entityUrl)
  }

  const badge = unread === 0 ? null : unread > 9 ? "9+" : String(unread)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <Bell className="h-5 w-5" />
          {badge && (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C8151B] px-1 text-[10px] font-semibold leading-none text-white">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Notifications
            </p>
            {unread > 0 && (
              <p className="text-xs text-zinc-500">
                {unread} non lue{unread > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={marking}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#C8151B] hover:text-[#a01015] disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer lu
            </button>
          )}
        </div>

        <ul className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-6 w-6 text-zinc-300" />
              <p className="text-sm text-zinc-500">Aucune notification</p>
            </li>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] ?? Bell
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
                      !n.read && "bg-red-50/40"
                    )}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {n.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-zinc-500">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="border-t border-zinc-200 px-4 py-2">
          <Link
            href="/admin/journal"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-zinc-600 hover:text-[#C8151B]"
          >
            Voir le journal complet
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
