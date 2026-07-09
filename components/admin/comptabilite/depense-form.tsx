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
  EXPENSE_CATEGORIES_LABELS,
  EXPENSE_CATEGORY_KEYS,
} from "@/lib/comptabilite"

const formSchema = z.object({
  category: z.enum([
    "equipement",
    "transport",
    "sous_traitance",
    "charges_fixes",
    "marketing",
    "divers",
  ]),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && v > 0, "Montant invalide"),
  date: z.string().min(1, "Date requise"),
  description: z.string().trim().min(1, "Description requise"),
  projectId: z.string().optional().or(z.literal("")),
})

type FormValues = z.input<typeof formSchema>

type ProjectOption = { id: string; title: string }

export function DepenseForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "equipement",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
      projectId: "",
    },
  })

  const category = watch("category")
  const projectId = watch("projectId")

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      category: "equipement",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
      projectId: "",
    })
    fetch("/api/projets?limit=500", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.projects
        if (Array.isArray(raw)) {
          setProjects(
            (raw as Array<{ id: string; title: string }>).map((p) => ({
              id: p.id,
              title: p.title,
            }))
          )
        }
      })
      .catch(() => setProjects([]))
  }, [open, reset])

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = formSchema.parse(raw)
      const r = await fetch("/api/comptabilite/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed,
          projectId: parsed.projectId || undefined,
        }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setServerError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement."
        )
        return
      }
      onSaved()
      onOpenChange(false)
    } catch {
      setServerError("Connexion impossible.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>Ajouter une depense</SheetTitle>
          <SheetDescription>
            Categorie, montant, date, description et projet associe optionnel.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="dep-category">Categorie *</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setValue("category", v as FormValues["category"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="dep-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORY_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {EXPENSE_CATEGORIES_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dep-amount">Montant (FCFA) *</Label>
              <Input
                id="dep-amount"
                type="number"
                step="100"
                min="0"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-date">Date *</Label>
              <Input id="dep-date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dep-description">Description *</Label>
            <Textarea
              id="dep-description"
              rows={3}
              {...register("description")}
              placeholder="Achat batteries, taxi vers le lieu, sous-traitance son..."
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dep-project">Projet associe (optionnel)</Label>
            <Select
              value={projectId || "_none"}
              onValueChange={(v) =>
                setValue("projectId", v === "_none" ? "" : v, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="dep-project">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Aucun projet</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={submitting}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {submitting ? "Enregistrement..." : "Ajouter la depense"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
