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
  SESSION_STATUSES,
  SESSION_STATUS_KEYS,
  toDatetimeLocal,
  type SessionStatus,
} from "@/lib/formations"

const formSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  dateStart: z.string().trim().min(1, "Date de debut requise"),
  dateEnd: z.string().trim().min(1, "Date de fin requise"),
  location: z.string().trim().min(1, "Lieu requis"),
  maxSeats: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isInteger(v) && v > 0, "Places invalides"),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && v > 0, "Prix invalide"),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["ouvert", "complet", "annule"]),
})

type FormValues = z.input<typeof formSchema>

export type SessionFormInitial = {
  id?: string
  title?: string
  dateStart?: string | Date | null
  dateEnd?: string | Date | null
  location?: string | null
  maxSeats?: number
  price?: number
  description?: string | null
  status?: SessionStatus
}

export function SessionForm({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: SessionFormInitial
  onSaved: () => void
}) {
  const isEdit = Boolean(initial?.id)
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
      title: "",
      dateStart: "",
      dateEnd: "",
      location: "Dakar",
      maxSeats: "",
      price: "",
      description: "",
      status: "ouvert",
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      title: initial?.title ?? "",
      dateStart: toDatetimeLocal(initial?.dateStart ?? null),
      dateEnd: toDatetimeLocal(initial?.dateEnd ?? null),
      location: initial?.location ?? "Dakar",
      maxSeats:
        initial?.maxSeats !== undefined ? String(initial.maxSeats) : "",
      price: initial?.price !== undefined ? String(initial.price) : "",
      description: initial?.description ?? "",
      status: initial?.status ?? "ouvert",
    })
  }, [open, initial, reset])

  const status = watch("status")

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = formSchema.parse(raw)
      const payload = {
        title: parsed.title,
        dateStart: parsed.dateStart,
        dateEnd: parsed.dateEnd,
        location: parsed.location,
        maxSeats: parsed.maxSeats,
        price: parsed.price,
        description: parsed.description || "",
        status: parsed.status,
      }
      const url = isEdit
        ? `/api/formations/sessions/${initial?.id}`
        : "/api/formations/sessions"
      const method = isEdit ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>
            {isEdit ? "Modifier la session" : "Nouvelle session"}
          </SheetTitle>
          <SheetDescription>
            Renseignez les informations de la session de formation.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Titre *</Label>
            <Input id="session-title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="session-start">Debut *</Label>
              <Input
                id="session-start"
                type="datetime-local"
                {...register("dateStart")}
              />
              {errors.dateStart && (
                <p className="text-xs text-red-600">
                  {errors.dateStart.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-end">Fin *</Label>
              <Input
                id="session-end"
                type="datetime-local"
                {...register("dateEnd")}
              />
              {errors.dateEnd && (
                <p className="text-xs text-red-600">{errors.dateEnd.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-location">Lieu *</Label>
            <Input id="session-location" {...register("location")} />
            {errors.location && (
              <p className="text-xs text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="session-seats">Places maximum *</Label>
              <Input
                id="session-seats"
                type="number"
                min="1"
                step="1"
                {...register("maxSeats")}
              />
              {errors.maxSeats && (
                <p className="text-xs text-red-600">
                  {errors.maxSeats.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-price">Prix (FCFA) *</Label>
              <Input
                id="session-price"
                type="number"
                min="0"
                step="1000"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-red-600">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-status">Statut</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as SessionStatus, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="session-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_STATUS_KEYS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SESSION_STATUSES[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-description">Description</Label>
            <Textarea
              id="session-description"
              rows={4}
              {...register("description")}
              placeholder="Programme, prerequis, public vise..."
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
              disabled={submitting}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {submitting
                ? "Enregistrement..."
                : isEdit
                ? "Enregistrer"
                : "Creer la session"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
