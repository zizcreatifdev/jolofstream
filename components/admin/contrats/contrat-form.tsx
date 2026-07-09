"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TEMPLATE_TYPES, TEMPLATE_TYPE_KEYS } from "@/lib/contrats"

type ProjectOption = {
  id: string
  title: string
  client: { id: string; name: string }
}

const formSchema = z.object({
  projectId: z.string().min(1, "Projet requis"),
  clientId: z.string().min(1),
  templateType: z.enum(
    TEMPLATE_TYPE_KEYS as [string, ...string[]]
  ),
  notes: z.string().optional(),
})

type FormValues = z.input<typeof formSchema>

export function ContratForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}) {
  const searchParams = useSearchParams()
  const presetProjectId = searchParams?.get("projectId") ?? ""

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      clientId: "",
      templateType: "prestation_services",
      notes: "",
    },
  })

  const projectId = watch("projectId")
  const templateType = watch("templateType")

  useEffect(() => {
    if (!open) return
    setServerError(null)
    fetch("/api/projets?limit=500", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.projects
        if (Array.isArray(raw)) {
          const opts = (
            raw as Array<{
              id: string
              title: string
              client?: { id: string; name: string }
              clientId?: string
            }>
          )
            .filter((p) => p.client?.id || p.clientId)
            .map((p) => ({
              id: p.id,
              title: p.title,
              client: p.client ?? { id: p.clientId ?? "", name: "" },
            }))
          setProjects(opts)
          const initialProjectId = presetProjectId || ""
          const match = opts.find((o) => o.id === initialProjectId)
          reset({
            projectId: initialProjectId,
            clientId: match?.client.id ?? "",
            templateType: "prestation_services",
            notes: "",
          })
        }
      })
      .catch(() => setProjects([]))
  }, [open, presetProjectId, reset])

  useEffect(() => {
    if (!projectId) return
    const match = projects.find((p) => p.id === projectId)
    if (match) {
      setValue("clientId", match.client.id, { shouldDirty: true })
    }
  }, [projectId, projects, setValue])

  const onSubmit = async (raw: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const data = formSchema.parse(raw)
      const r = await fetch("/api/contrats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        setServerError(
          (body && typeof body.error === "string" && body.error) ||
            "Echec de la creation"
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

  const selectedProject = projects.find((p) => p.id === projectId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>Nouveau contrat</SheetTitle>
          <SheetDescription>
            Selectionnez un projet, un type de contrat et ajoutez vos notes
            internes. Le client est rempli automatiquement.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 py-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="ctr-project">Projet *</Label>
            <Select
              value={projectId || ""}
              onValueChange={(v) =>
                setValue("projectId", v, { shouldDirty: true })
              }
            >
              <SelectTrigger id="ctr-project">
                <SelectValue placeholder="Choisir un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-zinc-500">
                    Aucun projet disponible
                  </div>
                ) : (
                  projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                      {p.client.name ? ` - ${p.client.name}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.projectId && (
              <p className="text-xs text-red-600">{errors.projectId.message}</p>
            )}
          </div>

          {selectedProject ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Client lie :{" "}
              <span className="font-semibold text-zinc-900">
                {selectedProject.client.name || "(non defini)"}
              </span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="ctr-template">Type de contrat *</Label>
            <Select
              value={templateType}
              onValueChange={(v) =>
                setValue("templateType", v as FormValues["templateType"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="ctr-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPE_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TEMPLATE_TYPES[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ctr-notes">Notes internes</Label>
            <Textarea
              id="ctr-notes"
              rows={4}
              placeholder="Notes confidentielles, conditions specifiques, references..."
              {...register("notes")}
            />
            <p className="text-xs text-zinc-500">
              Les notes apparaissent en bas de la derniere page du contrat
              dans un encadre jaune.
            </p>
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
              {submitting ? "Creation..." : "Creer le contrat"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
