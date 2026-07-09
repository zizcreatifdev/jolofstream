"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_KEYS,
  PROJECT_TYPES,
  PROJECT_TYPE_KEYS,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/projets"

const projectFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum([
    "streaming_live",
    "ceo_content",
    "creator_weekend",
    "gestion_reseaux",
    "autre",
  ]),
  status: z.enum([
    "prospect",
    "confirme",
    "en_cours",
    "livre",
    "archive",
    "perdu",
  ]),
  date: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  budgetEstimate: z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null
      const num = typeof value === "string" ? Number(value) : value
      return Number.isFinite(num) ? num : null
    })
    .nullable(),
  notes: z.string().optional().or(z.literal("")),
})

type ProjectFormSchema = z.input<typeof projectFormSchema>

export type ProjectFormInitial = {
  id?: string
  clientId?: string
  title?: string
  type?: ProjectType
  status?: ProjectStatus
  date?: string | null
  location?: string | null
  budgetEstimate?: number | null
  notes?: string | null
}

type ClientOption = {
  id: string
  name: string
  organization: string | null
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function ProjectForm({
  open,
  onOpenChange,
  initial,
  onSaved,
  defaultClientId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ProjectFormInitial
  onSaved: () => void
  defaultClientId?: string
}) {
  const isEdit = Boolean(initial?.id)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      clientId: "",
      title: "",
      type: "streaming_live",
      status: "prospect",
      date: "",
      location: "",
      budgetEstimate: null,
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      clientId: initial?.clientId ?? defaultClientId ?? "",
      title: initial?.title ?? "",
      type: (initial?.type as ProjectType) ?? "streaming_live",
      status: (initial?.status as ProjectStatus) ?? "prospect",
      date: toDateInputValue(initial?.date ?? null),
      location: initial?.location ?? "",
      budgetEstimate: initial?.budgetEstimate ?? null,
      notes: initial?.notes ?? "",
    })
  }, [open, initial, defaultClientId, reset])

  useEffect(() => {
    if (!open) return
    setClientsLoading(true)
    fetch("/api/clients?limit=500", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("clients fetch failed")
        return response.json()
      })
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.clients
        const list = Array.isArray(raw)
          ? (raw as Array<{
              id: string
              name: string
              organization: string | null
            }>)
          : []
        setClients(
          list.map((c) => ({
            id: c.id,
            name: c.name,
            organization: c.organization,
          }))
        )
      })
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false))
  }, [open])

  const clientId = watch("clientId")
  const type = watch("type")
  const status = watch("status")

  const onSubmit = async (raw: ProjectFormSchema) => {
    setSubmitting(true)
    setServerError(null)
    const parsed = projectFormSchema.parse(raw)
    try {
      const url = isEdit ? `/api/projets/${initial?.id}` : "/api/projets"
      const method = isEdit ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setServerError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement. Reessayez."
        )
        return
      }
      onSaved()
      onOpenChange(false)
    } catch {
      setServerError("Connexion impossible. Reessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>{isEdit ? "Modifier le projet" : "Nouveau projet"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Mettez a jour les details du projet."
              : "Selectionnez un client puis renseignez les details du projet."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="project-client">Client *</Label>
            <Select
              value={clientId}
              onValueChange={(value) =>
                setValue("clientId", value, { shouldDirty: true, shouldValidate: true })
              }
            >
              <SelectTrigger id="project-client">
                <SelectValue
                  placeholder={
                    clientsLoading
                      ? "Chargement..."
                      : clients.length === 0
                      ? "Aucun client disponible"
                      : "Choisir un client"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.organization ? ` - ${c.organization}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-xs text-red-600">{errors.clientId.message}</p>
            )}
            {!clientsLoading && clients.length === 0 && (
              <p className="text-xs text-zinc-500">
                Creez au moins un client avant d&apos;ajouter un projet.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-title">Titre *</Label>
            <Input
              id="project-title"
              autoComplete="off"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("type", value as ProjectType, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {PROJECT_TYPES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-status">Statut</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as ProjectStatus, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {PROJECT_STATUSES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-date">Date de l&apos;evenement</Label>
              <Input id="project-date" type="date" {...register("date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-location">Lieu</Label>
              <Input
                id="project-location"
                autoComplete="off"
                {...register("location")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-budget">Budget estimatif</Label>
            <div className="relative">
              <Input
                id="project-budget"
                type="number"
                step="1000"
                min="0"
                className="pr-16"
                {...register("budgetEstimate")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                FCFA
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-notes">Notes</Label>
            <Textarea
              id="project-notes"
              rows={4}
              {...register("notes")}
              placeholder="Brief, equipements, intervenants, contraintes..."
            />
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || clients.length === 0}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {submitting
                ? "Enregistrement..."
                : isEdit
                ? "Enregistrer"
                : "Creer le projet"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
