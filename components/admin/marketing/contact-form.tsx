"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LISTES_PREDEFINIES,
  getListeColor,
  getListeLabel,
} from "@/lib/marketing"
import { cn } from "@/lib/utils"

type ClientOption = { id: string; name: string }

export type ContactFormInitial = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  clientId: string | null
  lists: string[]
}

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
})

type FormValues = z.input<typeof formSchema>

export function ContactForm({
  open,
  onOpenChange,
  onSaved,
  initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  initial?: ContactFormInitial | null
}) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [lists, setLists] = useState<string[]>([])
  const [newListInput, setNewListInput] = useState("")
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
      email: "",
      firstName: "",
      lastName: "",
      clientId: "",
    },
  })

  const clientId = watch("clientId")

  useEffect(() => {
    if (!open) return
    setServerError(null)
    setNewListInput("")
    fetch("/api/clients", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(
            (data as Array<{ id: string; name: string }>).map((c) => ({
              id: c.id,
              name: c.name,
            }))
          )
        }
      })
      .catch(() => setClients([]))

    if (initial) {
      reset({
        email: initial.email,
        firstName: initial.firstName ?? "",
        lastName: initial.lastName ?? "",
        clientId: initial.clientId ?? "",
      })
      setLists(initial.lists ?? [])
    } else {
      reset({ email: "", firstName: "", lastName: "", clientId: "" })
      setLists([])
    }
  }, [open, initial, reset])

  const toggleList = (l: string) => {
    setLists((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    )
  }

  const addCustomList = () => {
    const trimmed = newListInput.trim().toLowerCase().replace(/\s+/g, "_")
    if (!trimmed) return
    if (!lists.includes(trimmed)) setLists((prev) => [...prev, trimmed])
    setNewListInput("")
  }

  const removeList = (l: string) => {
    setLists((prev) => prev.filter((x) => x !== l))
  }

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = formSchema.parse(raw)
      const payload = {
        ...parsed,
        clientId: parsed.clientId || undefined,
        lists,
      }
      const url = initial
        ? `/api/marketing/contacts/${initial.id}`
        : "/api/marketing/contacts"
      const method = initial ? "PATCH" : "POST"
      const body = initial
        ? {
            firstName: payload.firstName,
            lastName: payload.lastName,
            clientId: payload.clientId,
            lists,
          }
        : payload

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        setServerError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement"
        )
        return
      }
      onSaved()
      onOpenChange(false)
    } catch {
      setServerError("Connexion impossible")
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
          <SheetTitle>
            {initial ? "Modifier le contact" : "Nouveau contact"}
          </SheetTitle>
          <SheetDescription>
            Email, listes d&apos;abonnement et client CRM associe optionnel.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="mc-email">Email *</Label>
            <Input
              id="mc-email"
              type="email"
              {...register("email")}
              disabled={Boolean(initial)}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
            {initial && (
              <p className="text-xs text-zinc-500">
                L&apos;email ne peut pas etre modifie.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mc-firstname">Prenom</Label>
              <Input id="mc-firstname" {...register("firstName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mc-lastname">Nom</Label>
              <Input id="mc-lastname" {...register("lastName")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Listes</Label>
            <div className="flex flex-wrap gap-2">
              {LISTES_PREDEFINIES.map((l) => {
                const active = lists.includes(l)
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleList(l)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? cn(
                            "border-transparent",
                            getListeColor(l)
                          )
                        : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                    )}
                  >
                    {getListeLabel(l)}
                  </button>
                )
              })}
            </div>
            {lists.filter((l) => !LISTES_PREDEFINIES.includes(l as never))
              .length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {lists
                  .filter(
                    (l) => !LISTES_PREDEFINIES.includes(l as never)
                  )
                  .map((l) => (
                    <span
                      key={l}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        getListeColor(l)
                      )}
                    >
                      {l}
                      <button
                        type="button"
                        onClick={() => removeList(l)}
                        className="ml-1 hover:opacity-70"
                        aria-label={`Retirer ${l}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="liste personnalisee..."
                value={newListInput}
                onChange={(e) => setNewListInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomList()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomList}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mc-client">Client CRM associe (optionnel)</Label>
            <Select
              value={clientId || "_none"}
              onValueChange={(v) =>
                setValue("clientId", v === "_none" ? "" : v, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="mc-client">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Aucun</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
              {submitting
                ? "Enregistrement..."
                : initial
                  ? "Mettre a jour"
                  : "Ajouter"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
