"use client"

import { useCallback, useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const ENTITY_TYPES = [
  "Client",
  "Project",
  "Quote",
  "Invoice",
  "Expense",
  "TrainingSession",
  "TrainingRegistration",
  "Offer",
  "PortfolioItem",
  "Setting",
  "User",
  "Task",
] as const

type Log = {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE"
  entityType: string
  description: string
  createdAt: string
  user: { id: string; firstName: string; lastName: string }
}

type UserOption = { id: string; firstName: string; lastName: string }

function actionBadge(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-emerald-100 text-emerald-700"
    case "DELETE":
      return "bg-red-100 text-red-700"
    case "UPDATE":
      return "bg-blue-100 text-blue-700"
    default:
      return "bg-zinc-100 text-zinc-700"
  }
}

function initials(firstName: string, lastName: string) {
  return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "JS"
}

function formatRelative(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "a l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function formatAbsolute(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

const PAGE_SIZE = 20

export function JournalTab({ users }: { users: UserOption[] }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [appending, setAppending] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [entityType, setEntityType] = useState("")
  const [userId, setUserId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchLogs = useCallback(
    async (nextPage: number, append = false) => {
      if (append) setAppending(true)
      else setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set("page", String(nextPage))
      params.set("limit", String(PAGE_SIZE))
      if (debounced) params.set("search", debounced)
      if (entityType) params.set("entityType", entityType)
      if (userId) params.set("userId", userId)
      try {
        const r = await fetch(`/api/journal?${params}`, { cache: "no-store" })
        if (!r.ok) throw new Error("Erreur de chargement")
        const data = (await r.json()) as {
          logs: Log[]
          total: number
          pages: number
        }
        setTotalPages(data.pages)
        setLogs((prev) => (append ? [...prev, ...data.logs] : data.logs))
        setPage(nextPage)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
        if (!append) setLogs([])
      } finally {
        setLoading(false)
        setAppending(false)
      }
    },
    [debounced, entityType, userId]
  )

  useEffect(() => {
    fetchLogs(1, false)
  }, [fetchLogs])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recherche
          </label>
          <Input
            placeholder="Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-52">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Type
          </label>
          <Select
            value={entityType || "_all"}
            onValueChange={(v) => setEntityType(v === "_all" ? "" : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-52">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Utilisateur
          </label>
          <Select
            value={userId || "_all"}
            onValueChange={(v) => setUserId(v === "_all" ? "" : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entite</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  Aucun log pour ces filtres.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell
                    className="text-xs text-zinc-600"
                    title={formatAbsolute(log.createdAt)}
                  >
                    {formatRelative(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700">
                        {initials(log.user.firstName, log.user.lastName)}
                      </span>
                      <span className="text-xs text-zinc-700">
                        {log.user.firstName} {log.user.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        actionBadge(log.action)
                      )}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {log.description}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && logs.length > 0 && page < totalPages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page + 1, true)}
            disabled={appending}
          >
            {appending ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      )}
    </div>
  )
}
