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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/ui/image-upload"
import {
  PORTFOLIO_TYPES,
  PORTFOLIO_TYPE_KEYS,
  youtubeThumbnail,
  type PortfolioType,
} from "@/lib/portfolio"

const formSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum([
    "streaming_live",
    "ceo_content",
    "creator_weekend",
    "formations",
  ]),
  date: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  mediaType: z.enum(["photo", "youtube"]),
  mediaUrl: z.string().trim().url("URL invalide"),
  thumbnailUrl: z
    .string()
    .trim()
    .url("URL invalide")
    .optional()
    .or(z.literal("")),
  published: z.boolean(),
  displayOrder: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const num = typeof v === "string" ? Number(v) : v
      return Number.isFinite(num) ? Math.floor(num) : 0
    }),
})

type FormValues = z.input<typeof formSchema>

export type PortfolioItemFormInitial = {
  id?: string
  title?: string
  type?: PortfolioType
  date?: string | Date | null
  description?: string | null
  mediaType?: "photo" | "youtube"
  mediaUrl?: string
  thumbnailUrl?: string | null
  published?: boolean
  displayOrder?: number
}

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function normalizeYoutubeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (
    trimmed.startsWith("youtu.be/") ||
    trimmed.startsWith("youtube.com/") ||
    trimmed.startsWith("www.youtube.com/") ||
    trimmed.startsWith("m.youtube.com/")
  ) {
    return `https://${trimmed}`
  }
  return trimmed
}

export function PortfolioItemForm({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PortfolioItemFormInitial
  onSaved: () => void
}) {
  const isEdit = Boolean(initial?.id)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [thumbnailExpanded, setThumbnailExpanded] = useState(false)

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
      type: "streaming_live",
      date: "",
      description: "",
      mediaType: "youtube",
      mediaUrl: "",
      thumbnailUrl: "",
      published: false,
      displayOrder: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      title: initial?.title ?? "",
      type: initial?.type ?? "streaming_live",
      date: toDateInput(initial?.date ?? null),
      description: initial?.description ?? "",
      mediaType: initial?.mediaType ?? "youtube",
      mediaUrl: initial?.mediaUrl ?? "",
      thumbnailUrl: initial?.thumbnailUrl ?? "",
      published: initial?.published ?? false,
      displayOrder: initial?.displayOrder ?? 0,
    })
    setThumbnailExpanded(Boolean(initial?.thumbnailUrl))
  }, [open, initial, reset])

  const type = watch("type")
  const mediaType = watch("mediaType")
  const thumbnailUrl = watch("thumbnailUrl") ?? ""
  const mediaUrl = watch("mediaUrl")
  const published = watch("published")

  const youtubeThumb =
    mediaType === "youtube" && mediaUrl ? youtubeThumbnail(mediaUrl) : null

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = formSchema.parse(raw)
      const url = isEdit
        ? `/api/portfolio/${initial?.id}`
        : "/api/portfolio"
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
            {isEdit ? "Modifier la realisation" : "Nouvelle realisation"}
          </SheetTitle>
          <SheetDescription>
            Renseignez le media (photo ou lien YouTube). La realisation
            n&apos;apparait sur le site qu&apos;une fois publiee.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="portfolio-title">Titre *</Label>
            <Input id="portfolio-title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="portfolio-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setValue("type", v as PortfolioType, { shouldDirty: true })
                }
              >
                <SelectTrigger id="portfolio-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_TYPE_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {PORTFOLIO_TYPES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portfolio-date">Date</Label>
              <Input
                id="portfolio-date"
                type="date"
                {...register("date")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="portfolio-description">Description</Label>
            <Textarea
              id="portfolio-description"
              rows={3}
              {...register("description")}
              placeholder="Description courte affichee sur la carte."
            />
          </div>

          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <Label className="text-sm font-semibold">Type de media</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="youtube"
                  checked={mediaType === "youtube"}
                  onChange={() =>
                    setValue("mediaType", "youtube", { shouldDirty: true })
                  }
                  className="h-4 w-4 accent-[#C8151B]"
                />
                YouTube
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="photo"
                  checked={mediaType === "photo"}
                  onChange={() =>
                    setValue("mediaType", "photo", { shouldDirty: true })
                  }
                  className="h-4 w-4 accent-[#C8151B]"
                />
                Photo (URL Supabase)
              </label>
            </div>
          </div>

          {mediaType === "youtube" ? (
            <div className="space-y-1.5">
              <Label htmlFor="portfolio-url">URL YouTube *</Label>
              <Input
                id="portfolio-url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                {...register("mediaUrl", {
                  onBlur: (e) => {
                    const normalized = normalizeYoutubeUrl(e.target.value)
                    if (normalized !== e.target.value) {
                      setValue("mediaUrl", normalized, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  },
                })}
              />
              <p className="text-xs text-zinc-500">
                Formats acceptes : https://youtube.com/watch?v=XXX,
                https://youtu.be/XXX, https://youtube.com/shorts/XXX,
                https://youtube.com/live/XXX. Le prefixe https:// est ajoute
                automatiquement si oublie.
              </p>
              {errors.mediaUrl && (
                <p className="text-xs text-red-600">
                  {errors.mediaUrl.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <ImageUpload
                value={mediaUrl}
                onChange={(url) =>
                  setValue("mediaUrl", url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                bucket="portfolio"
                label="Photo de la realisation *"
                hint="Format recommande : JPG, 1280x720px minimum"
                aspectRatio="landscape"
              />
              {errors.mediaUrl && (
                <p className="text-xs text-red-600">
                  {errors.mediaUrl.message}
                </p>
              )}
            </div>
          )}

          {mediaType === "youtube" && mediaUrl && (
            <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
              {youtubeThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={youtubeThumb}
                  alt="Apercu YouTube"
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget
                    if (img.src.includes("maxresdefault")) {
                      img.src = img.src.replace(
                        "maxresdefault",
                        "hqdefault"
                      )
                    } else {
                      img.style.display = "none"
                    }
                  }}
                />
              ) : (
                <div className="px-3 py-4 text-xs text-zinc-600">
                  URL YouTube invalide ou non reconnue. Apercu indisponible.
                </div>
              )}
            </div>
          )}

          {mediaType === "youtube" && (
            <div className="space-y-2">
              {thumbnailExpanded ? (
                <div className="space-y-1.5">
                  <ImageUpload
                    value={thumbnailUrl}
                    onChange={(url) =>
                      setValue("thumbnailUrl", url, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    bucket="portfolio"
                    label="Miniature personnalisee (optionnel)"
                    hint="Si YouTube ne fournit pas de miniature automatique (ex : Live termine). JPG/PNG, 1280x720px recommande."
                    aspectRatio="landscape"
                  />
                  {thumbnailUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue("thumbnailUrl", "", { shouldDirty: true })
                        setThumbnailExpanded(false)
                      }}
                    >
                      Retirer la miniature personnalisee
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setThumbnailExpanded(true)}
                >
                  Ajouter une miniature personnalisee
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="portfolio-published" className="text-sm font-semibold">
                Publie sur le site
              </Label>
              <Switch
                id="portfolio-published"
                checked={published}
                onCheckedChange={(c) =>
                  setValue("published", c, { shouldDirty: true })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portfolio-order">Ordre</Label>
              <Input
                id="portfolio-order"
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
                : "Creer la realisation"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
