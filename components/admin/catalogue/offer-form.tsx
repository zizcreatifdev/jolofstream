"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X as XIcon } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const offerFormSchema = z.object({
  serviceType: z.enum(["ceo_content", "creator_weekend"]),
  name: z.string().trim().min(1, "Nom requis"),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null
      const num = typeof v === "string" ? Number(v) : v
      return Number.isFinite(num) && num >= 0 ? num : null
    })
    .nullable(),
  priceLabel: z.string().trim().optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1)).min(1, "Au moins une fonctionnalite"),
  isPopular: z.boolean(),
  displayOrder: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const num = typeof v === "string" ? Number(v) : v
      return Number.isFinite(num) ? Math.floor(num) : 0
    }),
  active: z.boolean(),
})

type OfferFormValues = z.input<typeof offerFormSchema>

export type OfferFormInitial = {
  id?: string
  serviceType?: "ceo_content" | "creator_weekend"
  name?: string
  price?: number | null
  priceLabel?: string | null
  features?: string[]
  isPopular?: boolean
  displayOrder?: number
  active?: boolean
}

export function OfferForm({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: OfferFormInitial
  onSaved: () => void
}) {
  const isEdit = Boolean(initial?.id)
  const [featureDraft, setFeatureDraft] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      serviceType: "ceo_content",
      name: "",
      price: "",
      priceLabel: "par mois",
      features: [],
      isPopular: false,
      displayOrder: 1,
      active: true,
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    setFeatureDraft("")
    reset({
      serviceType: initial?.serviceType ?? "ceo_content",
      name: initial?.name ?? "",
      price: initial?.price !== null && initial?.price !== undefined
        ? String(initial.price)
        : "",
      priceLabel: initial?.priceLabel ?? "par mois",
      features: initial?.features ?? [],
      isPopular: initial?.isPopular ?? false,
      displayOrder: initial?.displayOrder ?? 1,
      active: initial?.active ?? true,
    })
  }, [open, initial, reset])

  const features = watch("features")
  const serviceType = watch("serviceType")
  const isPopular = watch("isPopular")
  const active = watch("active")

  const addFeature = () => {
    const v = featureDraft.trim()
    if (!v) return
    if (features.includes(v)) {
      setFeatureDraft("")
      return
    }
    setValue("features", [...features, v], {
      shouldDirty: true,
      shouldValidate: true,
    })
    setFeatureDraft("")
  }

  const removeFeature = (item: string) => {
    setValue(
      "features",
      features.filter((f) => f !== item),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  const onSubmit = async (raw: OfferFormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = offerFormSchema.parse(raw)
      const url = isEdit
        ? `/api/catalogue/${initial?.id}`
        : "/api/catalogue"
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
            {isEdit ? "Modifier le forfait" : "Nouveau forfait"}
          </SheetTitle>
          <SheetDescription>
            Les modifications s&apos;affichent en temps reel sur le site
            public /services.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="offer-service">Type de service *</Label>
            <Select
              value={serviceType}
              onValueChange={(v) =>
                setValue(
                  "serviceType",
                  v as "ceo_content" | "creator_weekend",
                  { shouldDirty: true }
                )
              }
            >
              <SelectTrigger id="offer-service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceo_content">CEO Content Package</SelectItem>
                <SelectItem value="creator_weekend">Creator Weekend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-name">Nom du forfait *</Label>
            <Input id="offer-name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="offer-price">Prix (FCFA)</Label>
              <Input
                id="offer-price"
                type="number"
                step="1000"
                min="0"
                placeholder="Sur devis"
                {...register("price")}
              />
              <p className="text-xs text-zinc-500">
                Vide = &laquo; Sur devis &raquo;
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-label">Label prix</Label>
              <Input
                id="offer-label"
                placeholder="par mois"
                {...register("priceLabel")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-features">Fonctionnalites *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="offer-features"
                value={featureDraft}
                onChange={(e) => setFeatureDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFeature()
                  }
                }}
                placeholder="Ajouter une fonctionnalite puis Entree"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                disabled={!featureDraft.trim()}
              >
                Ajouter
              </Button>
            </div>
            {features.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    <span className="truncate">{f}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(f)}
                      aria-label={`Supprimer ${f}`}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.features && (
              <p className="text-xs text-red-600">
                {(errors.features.message as string) || "Au moins une fonctionnalite"}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="offer-popular" className="text-sm font-semibold">
                  Mise en avant
                </Label>
                <p className="text-xs text-zinc-500">
                  Affiche le badge &laquo; Populaire &raquo; sur le site.
                </p>
              </div>
              <Switch
                id="offer-popular"
                checked={isPopular}
                onCheckedChange={(c) =>
                  setValue("isPopular", c, { shouldDirty: true })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="offer-active" className="text-sm font-semibold">
                  Actif
                </Label>
                <p className="text-xs text-zinc-500">
                  Si desactive, l&apos;offre est masquee du site public.
                </p>
              </div>
              <Switch
                id="offer-active"
                checked={active}
                onCheckedChange={(c) =>
                  setValue("active", c, { shouldDirty: true })
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <Label htmlFor="offer-order">Ordre d&apos;affichage</Label>
              <Input
                id="offer-order"
                type="number"
                step="1"
                min="0"
                {...register("displayOrder")}
              />
            </div>
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
                : "Creer le forfait"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
