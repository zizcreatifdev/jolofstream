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
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_KEYS,
  type ExpenseCategory,
} from "@/lib/projets"

const expenseFormSchema = z.object({
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
    .transform((value) => {
      const num = typeof value === "string" ? Number(value) : value
      return Number.isFinite(num) ? num : NaN
    })
    .refine((value) => Number.isFinite(value) && value > 0, {
      message: "Montant invalide",
    }),
  date: z.string().min(1, "Date requise"),
  description: z.string().trim().min(1, "Description requise"),
})

type ExpenseFormSchema = z.input<typeof expenseFormSchema>

export function ExpenseForm({
  open,
  onOpenChange,
  projectId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormSchema>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "equipement",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      category: "equipement",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
    })
  }, [open, reset])

  const category = watch("category")

  const onSubmit = async (raw: ExpenseFormSchema) => {
    setSubmitting(true)
    setServerError(null)
    const parsed = expenseFormSchema.parse(raw)
    try {
      const response = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, projectId }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setServerError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement."
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
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>Ajouter une depense</SheetTitle>
          <SheetDescription>
            La depense sera liee a ce projet pour le calcul de rentabilite.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Categorie</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setValue("category", value as ExpenseCategory, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORY_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {EXPENSE_CATEGORIES[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">Montant (FCFA) *</Label>
              <Input
                id="expense-amount"
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
              <Label htmlFor="expense-date">Date *</Label>
              <Input id="expense-date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-description">Description *</Label>
            <Textarea
              id="expense-description"
              rows={3}
              {...register("description")}
              placeholder="Achat batteries, taxi vers le lieu, prestataire son..."
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
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
