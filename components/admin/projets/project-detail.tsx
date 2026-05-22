"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ProjectForm,
  type ProjectFormInitial,
} from "@/components/admin/projets/project-form"
import { ExpenseForm } from "@/components/admin/projets/expense-form"
import {
  EXPENSE_CATEGORIES,
  PROJECT_STATUSES,
  PROJECT_STATUS_KEYS,
  PROJECT_TYPES,
  formatAmount,
  formatDate,
  type ExpenseCategory,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/projets"
import { cn } from "@/lib/utils"
import { CONTRAT_STATUSES, TEMPLATE_TYPES } from "@/lib/contrats"

export type ProjectDetail = {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  date: Date | string | null
  location: string | null
  budgetEstimate: number | null
  notes: string | null
  client: {
    id: string
    name: string
    organization: string | null
  }
  quotes: Array<{
    id: string
    reference: string
    status: string
    totalTtc: number
    createdAt: Date | string
  }>
  invoices: Array<{
    id: string
    reference: string
    status: string
    totalTtc: number
    createdAt: Date | string
  }>
  expenses: Array<{
    id: string
    category: string
    amount: number
    date: Date | string
    description: string
  }>
  contracts?: Array<{
    id: string
    status: string
    templateType: string
    createdAt: Date | string
    signedAt: Date | string | null
  }>
}

export function ProjectDetailView({ project }: { project: ProjectDetail }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0)

  const initial: ProjectFormInitial = {
    id: project.id,
    clientId: project.client.id,
    title: project.title,
    type: project.type,
    status: project.status,
    date:
      project.date instanceof Date
        ? project.date.toISOString()
        : project.date,
    location: project.location,
    budgetEstimate: project.budgetEstimate,
    notes: project.notes,
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/projets/${project.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Suppression impossible."
        )
        return
      }
      router.push("/admin/projets")
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (status: ProjectStatus) => {
    setUpdatingStatus(true)
    setError(null)
    try {
      const response = await fetch(`/api/projets/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Mise a jour impossible."
        )
        return
      }
      router.refresh()
    } catch {
      setError("Connexion impossible.")
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <aside className="lg:col-span-1">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                PROJECT_TYPES[project.type].color
              )}
            >
              {PROJECT_TYPES[project.type].label}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                PROJECT_STATUSES[project.status].color
              )}
            >
              {PROJECT_STATUSES[project.status].label}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-zinc-900">
            {project.title}
          </h2>
          <Link
            href={`/admin/clients/${project.client.id}`}
            className="mt-1 inline-block text-sm font-medium text-[#C8151B] hover:underline"
          >
            {project.client.name}
            {project.client.organization && (
              <span className="text-zinc-500">
                {" "}
                - {project.client.organization}
              </span>
            )}
          </Link>

          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Date evenement
              </dt>
              <dd className="mt-0.5 text-zinc-900">
                {formatDate(project.date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Lieu
              </dt>
              <dd className="mt-0.5 text-zinc-900">
                {project.location || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Budget estimatif
              </dt>
              <dd className="mt-0.5 text-zinc-900">
                {formatAmount(project.budgetEstimate)}
              </dd>
            </div>
          </dl>

          {project.notes && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {project.notes}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <Label
              htmlFor="status-change"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Changer le statut
            </Label>
            <Select
              value={project.status}
              onValueChange={(value) =>
                handleStatusChange(value as ProjectStatus)
              }
              disabled={updatingStatus}
            >
              <SelectTrigger id="status-change">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_KEYS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROJECT_STATUSES[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </Button>
            {project.status === "prospect" && (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </Button>
            )}
          </div>
        </div>
      </aside>

      <section className="lg:col-span-2">
        <Tabs defaultValue="quotes">
          <TabsList>
            <TabsTrigger value="quotes">
              Devis ({project.quotes.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Factures ({project.invoices.length})
            </TabsTrigger>
            <TabsTrigger value="expenses">
              Depenses ({project.expenses.length})
            </TabsTrigger>
            <TabsTrigger value="contracts">
              Contrats ({project.contracts?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="mt-4 space-y-3">
            {project.quotes.length === 0 ? (
              <EmptyHistory
                label="devis"
                href={`/admin/devis-factures?projectId=${project.id}`}
                cta="Nouveau devis"
              />
            ) : (
              <RelatedList items={project.quotes} prefix="/admin/devis-factures" />
            )}
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/devis-factures?projectId=${project.id}`}>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Nouveau devis
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 space-y-3">
            {project.invoices.length === 0 ? (
              <EmptyHistory
                label="facture"
                href={`/admin/devis-factures?projectId=${project.id}`}
                cta="Nouvelle facture"
              />
            ) : (
              <RelatedList items={project.invoices} prefix="/admin/devis-factures" />
            )}
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/devis-factures?projectId=${project.id}`}>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Nouvelle facture
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-3">
            {project.expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-600">
                Aucune depense enregistree pour ce projet.
              </div>
            ) : (
              <ul className="space-y-2">
                {project.expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {e.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {EXPENSE_CATEGORIES[e.category as ExpenseCategory] ??
                          e.category}{" "}
                        - {formatDate(e.date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatAmount(e.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-sm font-medium text-zinc-700">
                Total depenses
              </p>
              <p className="text-base font-bold text-zinc-900">
                {formatAmount(totalExpenses)}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setExpenseOpen(true)}
                className="bg-[#C8151B] text-white hover:bg-[#a01015]"
                size="sm"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter une depense
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4 space-y-3">
            {!project.contracts || project.contracts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-600">
                Aucun contrat lie a ce projet.
              </div>
            ) : (
              <ul className="space-y-2">
                {project.contracts.map((c) => {
                  const meta =
                    CONTRAT_STATUSES[c.status as keyof typeof CONTRAT_STATUSES]
                  const label =
                    TEMPLATE_TYPES[
                      c.templateType as keyof typeof TEMPLATE_TYPES
                    ] ?? c.templateType
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
                    >
                      <Link
                        href={`/admin/contrats/${c.id}`}
                        className="flex-1"
                      >
                        <p className="text-sm font-medium text-zinc-900 hover:text-[#C8151B]">
                          {label}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Cree le {formatDate(c.createdAt)}
                          {c.signedAt
                            ? ` - signe le ${formatDate(c.signedAt)}`
                            : ""}
                        </p>
                      </Link>
                      {meta && (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/contrats?projectId=${project.id}&new=1`}>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Nouveau contrat
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={initial}
        onSaved={() => router.refresh()}
      />

      <ExpenseForm
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        projectId={project.id}
        onSaved={() => router.refresh()}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce projet ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Seuls les projets au statut
              Prospect peuvent etre supprimes.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-700">
            <span className="font-semibold">{project.title}</span>
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({
  htmlFor,
  className,
  children,
}: {
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  )
}

function EmptyHistory({
  label,
  href,
  cta,
}: {
  label: string
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center">
      <p className="text-sm text-zinc-600">Aucune {label} pour ce projet.</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

type RelatedRow = {
  id: string
  reference: string
  status: string
  totalTtc: number
  createdAt: Date | string
}

function RelatedList({
  items,
  prefix,
}: {
  items: RelatedRow[]
  prefix: string
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`${prefix}/${item.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {item.reference}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-900">
                {formatAmount(item.totalTtc)}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                {item.status}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
