"use client"

import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"

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
  INVOICE_STATUSES,
  INVOICE_STATUS_KEYS,
  QUOTE_STATUSES,
  QUOTE_STATUS_KEYS,
  calculateTotals,
  formatAmount,
  type InvoiceStatus,
  type QuoteStatus,
} from "@/lib/documents"
import { usePdfCompany } from "@/lib/use-pdf-company"

import { DocumentPreview } from "@/components/admin/documents/document-preview"

const lineSchema = z.object({
  description: z.string().trim().min(1, "Description requise"),
  quantity: z
    .union([z.string(), z.number()])
    .transform((value) => {
      const num = typeof value === "string" ? Number(value) : value
      return Number.isFinite(num) ? num : NaN
    })
    .refine((v) => Number.isFinite(v) && v > 0, "Quantite invalide"),
  unitPrice: z
    .union([z.string(), z.number()])
    .transform((value) => {
      const num = typeof value === "string" ? Number(value) : value
      return Number.isFinite(num) ? num : NaN
    })
    .refine((v) => Number.isFinite(v) && v >= 0, "Prix invalide"),
})

const baseSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  projectId: z.string().optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Objet requis"),
  brsEnabled: z.boolean(),
  tvaEnabled: z.boolean(),
  dateField: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(lineSchema).min(1, "Au moins une ligne"),
})

const quoteFormSchema = baseSchema.extend({
  status: z.enum(["brouillon", "envoye", "accepte", "refuse"]),
})

const invoiceFormSchema = baseSchema.extend({
  status: z.enum(["emise", "payee", "partiellement_payee", "annulee"]),
  invoiceType: z.enum(["standard", "acompte", "solde", "avoir"]),
})

type QuoteFormValues = z.input<typeof quoteFormSchema>
type InvoiceFormValues = z.input<typeof invoiceFormSchema>

export type DocumentKind = "devis" | "facture"

type ClientOption = {
  id: string
  name: string
  organization: string | null
  tvaExempt: boolean
}

type ProjectOption = {
  id: string
  title: string
  clientId: string
}

export type DocumentFormInitial = {
  id?: string
  clientId?: string
  projectId?: string | null
  subject?: string
  status?: string
  brsEnabled?: boolean
  tvaEnabled?: boolean
  dateField?: string | null
  notes?: string | null
  invoiceType?: "standard" | "acompte" | "solde" | "avoir"
  lines?: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function formatDateForPdf(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function DocumentForm({
  kind,
  open,
  onOpenChange,
  initial,
  onSaved,
  defaultProjectId,
}: {
  kind: DocumentKind
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: DocumentFormInitial
  onSaved: (created: { id: string; kind: DocumentKind }) => void
  defaultProjectId?: string
}) {
  const isEdit = Boolean(initial?.id)
  const company = usePdfCompany()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  type FormValues = QuoteFormValues | InvoiceFormValues
  const schema = kind === "devis" ? quoteFormSchema : invoiceFormSchema

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      kind === "devis"
        ? ({
            clientId: "",
            projectId: defaultProjectId ?? "",
            subject: "",
            status: "brouillon",
            brsEnabled: true,
            tvaEnabled: true,
            dateField: "",
            notes: "",
            lines: [{ description: "", quantity: 1, unitPrice: 0 }],
          } as QuoteFormValues)
        : ({
            clientId: "",
            projectId: defaultProjectId ?? "",
            subject: "",
            status: "emise",
            invoiceType: "standard",
            brsEnabled: true,
            tvaEnabled: true,
            dateField: "",
            notes: "",
            lines: [{ description: "", quantity: 1, unitPrice: 0 }],
          } as InvoiceFormValues),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    const base = {
      clientId: initial?.clientId ?? "",
      projectId: initial?.projectId ?? defaultProjectId ?? "",
      subject: initial?.subject ?? "",
      brsEnabled: initial?.brsEnabled ?? true,
      tvaEnabled: initial?.tvaEnabled ?? true,
      dateField: toDateInputValue(initial?.dateField ?? null),
      notes: initial?.notes ?? "",
      lines:
        initial?.lines && initial.lines.length > 0
          ? initial.lines
          : [{ description: "", quantity: 1, unitPrice: 0 }],
    }
    if (kind === "devis") {
      reset({
        ...base,
        status: (initial?.status as QuoteStatus) ?? "brouillon",
      } as QuoteFormValues)
    } else {
      reset({
        ...base,
        status: (initial?.status as InvoiceStatus) ?? "emise",
        invoiceType: initial?.invoiceType ?? "standard",
      } as InvoiceFormValues)
    }
  }, [open, initial, defaultProjectId, kind, reset])

  useEffect(() => {
    if (!open) return
    fetch("/api/clients?", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data)
          ? (data as Array<{
              id: string
              name: string
              organization: string | null
              tvaExempt: boolean
            }>)
          : []
        setClients(
          list.map((c) => ({
            id: c.id,
            name: c.name,
            organization: c.organization,
            tvaExempt: c.tvaExempt,
          }))
        )
      })
      .catch(() => setClients([]))

    fetch("/api/projets?", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data)
          ? (data as Array<{
              id: string
              title: string
              client: { id: string }
            }>)
          : []
        setProjects(
          list.map((p) => ({
            id: p.id,
            title: p.title,
            clientId: p.client.id,
          }))
        )
      })
      .catch(() => setProjects([]))
  }, [open])

  const watchedLines = watch("lines")
  const clientId = watch("clientId")
  const projectId = watch("projectId")
  const brsEnabled = watch("brsEnabled")
  const tvaEnabledRaw = watch("tvaEnabled")
  const status = watch("status")
  const notes = watch("notes")
  const dateField = watch("dateField")
  const invoiceType = (watch as (name: "invoiceType") => string | undefined)(
    "invoiceType"
  ) ?? undefined

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId]
  )
  const tvaExempt = selectedClient?.tvaExempt ?? false
  const tvaEnabled = tvaEnabledRaw && !tvaExempt

  useEffect(() => {
    if (tvaExempt && tvaEnabledRaw) {
      setValue("tvaEnabled", false)
    }
  }, [tvaExempt, tvaEnabledRaw, setValue])

  const projectsForClient = useMemo(
    () =>
      clientId ? projects.filter((p) => p.clientId === clientId) : projects,
    [projects, clientId]
  )

  const numericLines = useMemo(
    () =>
      watchedLines.map((l) => ({
        description: l.description || "",
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      })),
    [watchedLines]
  )

  const totals = useMemo(
    () => calculateTotals(numericLines, brsEnabled, tvaEnabled, tvaExempt),
    [numericLines, brsEnabled, tvaEnabled, tvaExempt]
  )

  const pdfProps = useMemo(
    () => ({
      type: kind,
      invoiceType: invoiceType as
        | "standard"
        | "acompte"
        | "solde"
        | "avoir"
        | undefined,
      reference: initial?.id ? "Reference existante" : "DEV/FAC-AAAA-JS-XXX",
      date: new Date().toLocaleDateString("fr-FR"),
      validUntil:
        kind === "devis" ? formatDateForPdf(dateField) || undefined : undefined,
      dueDate:
        kind === "facture"
          ? formatDateForPdf(dateField) || undefined
          : undefined,
      client: {
        name: selectedClient?.name ?? "Client",
        organization: selectedClient?.organization,
        email: null,
        phone: null,
      },
      lines: numericLines.map((l) => ({
        description: l.description || "Description",
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: l.quantity * l.unitPrice,
      })),
      subtotalHt: totals.subtotalHt,
      brsEnabled,
      brsAmount: totals.brsAmount,
      tvaEnabled,
      tvaAmount: totals.tvaAmount,
      tvaExempt,
      totalTtc: totals.totalTtc,
      notes,
      ...company,
    }),
    [
      kind,
      invoiceType,
      initial?.id,
      dateField,
      selectedClient,
      numericLines,
      totals,
      brsEnabled,
      tvaEnabled,
      tvaExempt,
      company,
      notes,
    ]
  )

  const onSubmit = handleSubmit(async (raw) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const parsed = schema.parse(raw)
      const payload =
        kind === "devis"
          ? {
              clientId: parsed.clientId,
              projectId: parsed.projectId || "",
              subject: parsed.subject,
              status: (parsed as QuoteFormValues).status,
              brsEnabled: parsed.brsEnabled,
              tvaEnabled: parsed.tvaEnabled,
              validUntil: parsed.dateField || "",
              notes: parsed.notes || "",
              lines: parsed.lines,
            }
          : {
              clientId: parsed.clientId,
              projectId: parsed.projectId || "",
              subject: parsed.subject,
              type: (parsed as InvoiceFormValues).invoiceType,
              status: (parsed as InvoiceFormValues).status,
              brsEnabled: parsed.brsEnabled,
              tvaEnabled: parsed.tvaEnabled,
              dueAt: parsed.dateField || "",
              notes: parsed.notes || "",
              lines: parsed.lines,
            }
      const url = isEdit
        ? `/api/${kind === "devis" ? "devis" : "factures"}/${initial?.id}`
        : `/api/${kind === "devis" ? "devis" : "factures"}`
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
      const saved = (await response.json()) as { id: string }
      onSaved({ id: saved.id, kind })
      onOpenChange(false)
    } catch (e) {
      if (e instanceof z.ZodError) {
        setServerError("Corrigez les erreurs du formulaire.")
      } else {
        setServerError("Connexion impossible. Reessayez.")
      }
    } finally {
      setSubmitting(false)
    }
  })

  const statusOptions =
    kind === "devis"
      ? QUOTE_STATUS_KEYS.map((k) => ({
          value: k,
          label: QUOTE_STATUSES[k].label,
        }))
      : INVOICE_STATUS_KEYS.map((k) => ({
          value: k,
          label: INVOICE_STATUSES[k].label,
        }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-full flex-col gap-0 overflow-y-auto p-0 sm:!max-w-[1180px]"
      >
        <SheetHeader className="border-b border-zinc-200 p-6 pb-4">
          <SheetTitle>
            {isEdit
              ? kind === "devis"
                ? "Modifier le devis"
                : "Modifier la facture"
              : kind === "devis"
              ? "Nouveau devis"
              : "Nouvelle facture"}
          </SheetTitle>
          <SheetDescription>
            Renseignez les informations et les lignes de prestation. La
            preview PDF se met a jour en direct.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_460px]"
          noValidate
        >
          <div className="space-y-5 overflow-y-auto p-6">
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Informations
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="doc-client">Client *</Label>
                  <Select
                    value={clientId}
                    onValueChange={(value) =>
                      setValue("clientId", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="doc-client">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.organization ? ` - ${c.organization}` : ""}
                          {c.tvaExempt ? " (TVA exoneree)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-xs text-red-600">
                      {errors.clientId.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-project">Projet</Label>
                  <Select
                    value={projectId || "_none"}
                    onValueChange={(value) =>
                      setValue("projectId", value === "_none" ? "" : value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="doc-project">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Aucun projet</SelectItem>
                      {projectsForClient.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-subject">Objet *</Label>
                <Input id="doc-subject" {...register("subject")} />
                {errors.subject && (
                  <p className="text-xs text-red-600">
                    {errors.subject.message as string}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="doc-status">Statut</Label>
                  <Select
                    value={status as string}
                    onValueChange={(value) =>
                      setValue(
                        "status" as const,
                        value as never,
                        {
                          shouldDirty: true,
                        }
                      )
                    }
                  >
                    <SelectTrigger id="doc-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-date">
                    {kind === "devis" ? "Valide jusqu'au" : "Echeance"}
                  </Label>
                  <Input id="doc-date" type="date" {...register("dateField")} />
                </div>
              </div>

              {kind === "facture" && (
                <div className="space-y-1.5">
                  <Label htmlFor="doc-invoice-type">Type de facture</Label>
                  <Select
                    value={invoiceType ?? "standard"}
                    onValueChange={(value) =>
                      setValue(
                        "invoiceType" as const,
                        value as never,
                        { shouldDirty: true }
                      )
                    }
                  >
                    <SelectTrigger id="doc-invoice-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Facture standard</SelectItem>
                      <SelectItem value="acompte">
                        Facture d&apos;acompte
                      </SelectItem>
                      <SelectItem value="solde">Facture de solde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="doc-brs" className="text-sm font-semibold">
                    BRS 5%
                  </Label>
                  <Switch
                    id="doc-brs"
                    checked={brsEnabled}
                    onCheckedChange={(c) =>
                      setValue("brsEnabled", c, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="doc-tva" className="text-sm font-semibold">
                      TVA 18%
                    </Label>
                    {tvaExempt && (
                      <p className="text-[10px] text-[#C8151B]">
                        Client exonere
                      </p>
                    )}
                  </div>
                  <Switch
                    id="doc-tva"
                    checked={tvaEnabledRaw && !tvaExempt}
                    disabled={tvaExempt}
                    onCheckedChange={(c) =>
                      setValue("tvaEnabled", c, { shouldDirty: true })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Lignes de prestations
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", quantity: 1, unitPrice: 0 })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une ligne
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => {
                  const lineErrors = errors.lines?.[index] as
                    | {
                        description?: { message?: string }
                        quantity?: { message?: string }
                        unitPrice?: { message?: string }
                      }
                    | undefined
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 rounded-md border border-zinc-200 bg-white p-3"
                    >
                      <div className="col-span-12 sm:col-span-6">
                        <Input
                          placeholder="Description"
                          {...register(`lines.${index}.description` as const)}
                        />
                        {lineErrors?.description?.message && (
                          <p className="mt-1 text-xs text-red-600">
                            {lineErrors.description.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Qte"
                          {...register(`lines.${index}.quantity` as const)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <Input
                          type="number"
                          step="100"
                          min="0"
                          placeholder="Prix unit."
                          {...register(`lines.${index}.unitPrice` as const)}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-start justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          aria-label="Supprimer la ligne"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <div className="flex justify-between text-zinc-700">
                  <span>Sous-total HT</span>
                  <span>{formatAmount(totals.subtotalHt)}</span>
                </div>
                {brsEnabled && (
                  <div className="flex justify-between text-zinc-700">
                    <span>BRS 5%</span>
                    <span>{formatAmount(totals.brsAmount)}</span>
                  </div>
                )}
                {tvaEnabled && (
                  <div className="flex justify-between text-zinc-700">
                    <span>TVA 18%</span>
                    <span>{formatAmount(totals.tvaAmount)}</span>
                  </div>
                )}
                {tvaExempt && (
                  <div className="flex justify-between text-[#C8151B]">
                    <span>TVA</span>
                    <span>Exoneree</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-zinc-300 pt-2 text-base font-bold text-zinc-900">
                  <span>Total TTC</span>
                  <span>{formatAmount(totals.totalTtc)}</span>
                </div>
              </div>
            </section>

            <section className="space-y-1.5">
              <Label htmlFor="doc-notes">Notes</Label>
              <Textarea
                id="doc-notes"
                rows={3}
                {...register("notes")}
                placeholder="Conditions particulieres, references..."
              />
            </section>

            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
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
                  : kind === "devis"
                  ? "Creer le devis"
                  : "Creer la facture"}
              </Button>
            </div>
          </div>

          <aside className="hidden bg-zinc-900 lg:block">
            <div className="sticky top-0 flex h-full flex-col">
              <div className="border-b border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Apercu
              </div>
              <div className="flex-1 overflow-y-auto bg-zinc-100 p-4">
                <DocumentPreview {...pdfProps} />
              </div>
            </div>
          </aside>
        </form>
      </SheetContent>
    </Sheet>
  )
}
