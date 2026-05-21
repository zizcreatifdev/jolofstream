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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  acquisitionLabels,
  clientStatusLabels,
  clientTypeLabels,
  type AcquisitionChannel,
  type ClientStatus,
  type ClientType,
} from "@/lib/clients"

const clientFormSchema = z.object({
  type: z.enum(["entreprise", "particulier", "createur", "association"]),
  name: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  organization: z.string().trim().optional().or(z.literal("")),
  acquisitionChannel: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["prospect", "actif", "inactif", "vip"]),
  tvaExempt: z.boolean(),
  notes: z.string().trim().optional().or(z.literal("")),
  tags: z.array(z.string()),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export type ClientFormInitial = Partial<ClientFormValues> & { id?: string }

export function ClientForm({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ClientFormInitial
  onSaved: () => void
}) {
  const isEdit = Boolean(initial?.id)
  const [tagDraft, setTagDraft] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      type: "entreprise",
      name: "",
      email: "",
      phone: "",
      organization: "",
      acquisitionChannel: "",
      status: "prospect",
      tvaExempt: false,
      notes: "",
      tags: [],
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    setTagDraft("")
    reset({
      type: (initial?.type as ClientType) ?? "entreprise",
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      organization: initial?.organization ?? "",
      acquisitionChannel: initial?.acquisitionChannel ?? "",
      status: (initial?.status as ClientStatus) ?? "prospect",
      tvaExempt: initial?.tvaExempt ?? false,
      notes: initial?.notes ?? "",
      tags: initial?.tags ?? [],
    })
  }, [open, initial, reset])

  const tags = watch("tags")
  const tvaExempt = watch("tvaExempt")
  const type = watch("type")
  const status = watch("status")
  const acquisitionChannel = watch("acquisitionChannel")

  const addTag = () => {
    const trimmed = tagDraft.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      setTagDraft("")
      return
    }
    setValue("tags", [...tags, trimmed], { shouldDirty: true })
    setTagDraft("")
  }

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag),
      { shouldDirty: true }
    )
  }

  const onSubmit = async (values: ClientFormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const url = isEdit ? `/api/clients/${initial?.id}` : "/api/clients"
      const method = isEdit ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
          <SheetTitle>{isEdit ? "Modifier le client" : "Nouveau client"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Mettez a jour la fiche client."
              : "Renseignez les informations du client."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("type", value as ClientType, { shouldDirty: true })
                }
              >
                <SelectTrigger id="client-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(clientTypeLabels) as ClientType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {clientTypeLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-status">Statut</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as ClientStatus, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="client-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(clientStatusLabels) as ClientStatus[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {clientStatusLabels[k]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-name">Nom *</Label>
            <Input id="client-name" autoComplete="off" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                autoComplete="off"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Telephone</Label>
              <Input
                id="client-phone"
                type="tel"
                autoComplete="off"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-organization">Organisation</Label>
            <Input
              id="client-organization"
              autoComplete="off"
              {...register("organization")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-acquisition">Canal d&apos;acquisition</Label>
            <Select
              value={acquisitionChannel || ""}
              onValueChange={(value) =>
                setValue("acquisitionChannel", value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="client-acquisition">
                <SelectValue placeholder="Choisir un canal" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(acquisitionLabels) as AcquisitionChannel[]).map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {acquisitionLabels[k]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="client-tva" className="text-sm font-semibold">
                Exoneration TVA
              </Label>
              <Switch
                id="client-tva"
                checked={tvaExempt}
                onCheckedChange={(checked) =>
                  setValue("tvaExempt", checked, { shouldDirty: true })
                }
              />
            </div>
            <p className="text-xs text-[#C8151B]">
              Si actif, la TVA sera automatiquement desactivee sur tous les
              documents generes pour ce client.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-tags">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                id="client-tags"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Ajouter un tag puis Entree"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!tagDraft.trim()}
              >
                Ajouter
              </Button>
            </div>
            {tags.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Supprimer ${tag}`}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-notes">Notes internes</Label>
            <Textarea
              id="client-notes"
              rows={4}
              {...register("notes")}
              placeholder="Contexte, projets potentiels, contraintes..."
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
              {submitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Creer le client"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
