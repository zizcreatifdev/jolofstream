"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type UserOption = { id: string; firstName: string; lastName: string }

type Task = {
  id: string
  title: string
  dueDate: string | null
  completed: boolean
  createdBy: string
  assignedTo: string | null
  assignee: UserOption | null
  creator: UserOption | null
}

type Filter = "toutes" | "mes" | "autre" | "retard"

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

function isToday(dueDate: string | null) {
  if (!dueDate) return false
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatDue(dueDate: string | null) {
  if (!dueDate) return "Sans echeance"
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function todayInputValue() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDateInput(value: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export function TasksTab({
  users,
  currentUserId,
}: {
  users: UserOption[]
  currentUserId: string
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("toutes")
  const [busyId, setBusyId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [newDue, setNewDue] = useState("")
  const [newAssignee, setNewAssignee] = useState<string>(currentUserId)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDue, setEditDue] = useState("")
  const [editAssignee, setEditAssignee] = useState<string>("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/taches", { cache: "no-store" })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as Task[]
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "mes") return t.assignedTo === currentUserId
      if (filter === "autre")
        return t.assignedTo !== null && t.assignedTo !== currentUserId
      if (filter === "retard") return !t.completed && isOverdue(t.dueDate)
      return true
    })
  }, [tasks, filter, currentUserId])

  const open = filtered.filter((t) => !t.completed)
  const done = filtered.filter((t) => t.completed)

  const toggleComplete = async (task: Task) => {
    setBusyId(task.id)
    try {
      const r = await fetch(`/api/taches/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Mise a jour impossible."
        )
      } else {
        fetchTasks()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setBusyId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    try {
      const r = await fetch("/api/taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: newDue || "",
          assignedTo: newAssignee || "",
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Creation impossible."
        )
      } else {
        setNewTitle("")
        setNewDue("")
        setNewAssignee(currentUserId)
        fetchTasks()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (task: Task) => {
    setEditTarget(task)
    setEditTitle(task.title)
    setEditDue(toDateInput(task.dueDate))
    setEditAssignee(task.assignedTo ?? "")
  }

  const handleEdit = async () => {
    if (!editTarget || !editTitle.trim()) return
    setSavingEdit(true)
    try {
      const r = await fetch(`/api/taches/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          dueDate: editDue || null,
          assignedTo: editAssignee || null,
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Modification impossible."
        )
      } else {
        setEditTarget(null)
        fetchTasks()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/taches/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
      } else {
        setDeleteTarget(null)
        fetchTasks()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_180px_auto]"
      >
        <Input
          placeholder="Nouvelle tache..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Input
          type="date"
          min={todayInputValue()}
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
        />
        <Select value={newAssignee} onValueChange={setNewAssignee}>
          <SelectTrigger>
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          {creating ? "..." : "Ajouter"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {(["toutes", "mes", "autre", "retard"] as Filter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
            }
          >
            {f === "toutes"
              ? "Toutes"
              : f === "mes"
                ? "Mes taches"
                : f === "autre"
                  ? "Taches de l'autre"
                  : "En retard"}
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : open.length === 0 && done.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
          Aucune tache pour ce filtre.
        </div>
      ) : (
        <div className="space-y-5">
          {open.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                A faire ({open.length})
              </h3>
              <ul className="space-y-2">
                {open.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    busy={busyId === t.id}
                    currentUserId={currentUserId}
                    onToggle={() => toggleComplete(t)}
                    onEdit={() => openEdit(t)}
                    onDelete={() => setDeleteTarget(t)}
                  />
                ))}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Completees ({done.length})
              </h3>
              <ul className="space-y-2">
                {done.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    busy={busyId === t.id}
                    currentUserId={currentUserId}
                    onToggle={() => toggleComplete(t)}
                    onEdit={() => openEdit(t)}
                    onDelete={() => setDeleteTarget(t)}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tache</DialogTitle>
            <DialogDescription>
              Mettez a jour le titre, la date d&apos;echeance ou l&apos;assignee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-due">Echeance</Label>
              <Input
                id="edit-due"
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-assignee">Assignee a</Label>
              <Select value={editAssignee} onValueChange={setEditAssignee}>
                <SelectTrigger id="edit-assignee">
                  <SelectValue placeholder="Non assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={savingEdit}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={savingEdit || !editTitle.trim()}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {savingEdit ? "..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette tache ?</DialogTitle>
            <DialogDescription>
              Seul le createur peut supprimer une tache. Si vous n&apos;avez pas
              cree cette tache, vous pouvez seulement la modifier ou la marquer
              comme completee.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.title}</span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskRow({
  task,
  busy,
  currentUserId,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  busy: boolean
  currentUserId: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const overdue = !task.completed && isOverdue(task.dueDate)
  const today = !task.completed && isToday(task.dueDate)
  const canDelete = task.createdBy === currentUserId

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-opacity",
        task.completed ? "border-zinc-100 opacity-60" : "border-zinc-200"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-label={task.completed ? "Re-ouvrir" : "Completer"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
          task.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
        )}
      >
        <Check className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-zinc-900",
            task.completed && "line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>{formatDue(task.dueDate)}</span>
          {task.assignee && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
              {task.assignee.firstName} {task.assignee.lastName}
            </span>
          )}
          {overdue && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              En retard
            </span>
          )}
          {today && (
            <span className="rounded-full bg-[#F5B800]/30 px-2 py-0.5 text-[10px] font-semibold text-[#8a6500]">
              Aujourd&apos;hui
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={busy}
          aria-label="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={busy || !canDelete}
          aria-label="Supprimer"
          className={cn(
            canDelete
              ? "text-red-600 hover:bg-red-50"
              : "text-zinc-300 cursor-not-allowed"
          )}
          title={
            canDelete
              ? "Supprimer"
              : "Seul le createur peut supprimer cette tache"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}
