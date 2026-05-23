"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bold,
  CheckCircle2,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  Send,
  Type,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CAMPAIGN_TEMPLATES,
  renderCampaignHtml,
} from "@/lib/campaign-templates"
import {
  LISTES_PREDEFINIES,
  getListeColor,
  getListeLabel,
} from "@/lib/marketing"
import { cn } from "@/lib/utils"

export type CampaignEditorValues = {
  title: string
  subject: string
  body: string
  lists: string[]
  templateType: string
  scheduledAt: string
}

export function CampaignEditor({
  initial,
  readOnly = false,
  onChange,
}: {
  initial?: Partial<CampaignEditorValues>
  readOnly?: boolean
  onChange?: (v: CampaignEditorValues) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [body, setBody] = useState(initial?.body ?? "")
  const [lists, setLists] = useState<string[]>(initial?.lists ?? [])
  const [templateType, setTemplateType] = useState(
    initial?.templateType ?? ""
  )
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "")
  const [previewHtml, setPreviewHtml] = useState("")
  const [listeCounts, setListeCounts] = useState<Record<string, number>>({})
  const [availableListes, setAvailableListes] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Charger les listes disponibles depuis l'API
  useEffect(() => {
    fetch("/api/marketing/listes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.listes) setAvailableListes(data.listes)
        if (data?.counts) setListeCounts(data.counts)
      })
      .catch(() => undefined)
  }, [])

  // Debounce preview rendering
  useEffect(() => {
    const t = setTimeout(() => {
      setPreviewHtml(renderCampaignHtml({ subject, body }))
    }, 500)
    return () => clearTimeout(t)
  }, [subject, body])

  // Propager les changements au parent
  useEffect(() => {
    onChange?.({
      title,
      subject,
      body,
      lists,
      templateType,
      scheduledAt,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subject, body, lists, templateType, scheduledAt])

  const totalDestinataires = useMemo(
    () =>
      lists.reduce((acc, l) => acc + (listeCounts[l] ?? 0), 0),
    [lists, listeCounts]
  )

  const applyTemplate = (id: string) => {
    if (readOnly) return
    if (id === "_custom") {
      setTemplateType("")
      return
    }
    const tpl = CAMPAIGN_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return
    setTemplateType(tpl.id)
    setSubject(tpl.subject)
    setBody(tpl.body)
  }

  const toggleListe = (l: string) => {
    if (readOnly) return
    setLists((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    )
  }

  const insertAroundSelection = (before: string, after: string) => {
    if (readOnly) return
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const selected = body.slice(start, end) || "texte"
    const next = body.slice(0, start) + before + selected + after + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      const cursor = start + before.length + selected.length + after.length
      ta.setSelectionRange(cursor, cursor)
    })
  }

  const insertLink = () => {
    if (readOnly) return
    const url = window.prompt("URL du lien :", "https://")
    if (!url) return
    insertAroundSelection(`<a href="${url}">`, "</a>")
  }

  const allListes = useMemo(
    () =>
      Array.from(
        new Set([...LISTES_PREDEFINIES, ...availableListes])
      ).filter((l) => l && typeof l === "string"),
    [availableListes]
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
      {/* COLONNE GAUCHE - Editeur */}
      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Informations
          </h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ce-title">Titre de la campagne *</Label>
              <Input
                id="ce-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={readOnly}
                placeholder="Nom interne de la campagne"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-subject">Objet de l&apos;email *</Label>
              <Input
                id="ce-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={readOnly}
                placeholder="Ce que verront les destinataires dans leur boite"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Listes destinataires *</Label>
              <div className="flex flex-wrap gap-2">
                {allListes.map((l) => {
                  const active = lists.includes(l)
                  const count = listeCounts[l] ?? 0
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleListe(l)}
                      disabled={readOnly}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                        active
                          ? cn("border-transparent", getListeColor(l))
                          : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50",
                        readOnly && "cursor-default opacity-90"
                      )}
                    >
                      {getListeLabel(l)}
                      <span className="text-[10px] opacity-70">
                        ({count})
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-zinc-500">
                Total destinataires :{" "}
                <span className="font-semibold text-zinc-900">
                  {totalDestinataires}
                </span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-scheduled">
                Date d&apos;envoi planifie (optionnel)
              </Label>
              <Input
                id="ce-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Template
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAMPAIGN_TEMPLATES.map((tpl) => {
              const active = templateType === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl.id)}
                  disabled={readOnly}
                  className={cn(
                    "relative rounded-lg border p-3 text-left transition",
                    active
                      ? "border-[#C8151B] bg-red-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                    readOnly && "cursor-default opacity-90"
                  )}
                >
                  {active && (
                    <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[#C8151B]" />
                  )}
                  <p className="text-sm font-semibold text-zinc-900">
                    {tpl.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {tpl.description}
                  </p>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => applyTemplate("_custom")}
              disabled={readOnly}
              className={cn(
                "rounded-lg border border-dashed border-zinc-300 bg-white p-3 text-left transition hover:border-zinc-400",
                !templateType && "border-zinc-500 bg-zinc-50",
                readOnly && "cursor-default opacity-90"
              )}
            >
              <p className="text-sm font-semibold text-zinc-900">
                Contenu personnalise
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Ne pas appliquer de template, ecrire le contenu de zero.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Contenu (HTML)
          </h2>

          {!readOnly && (
            <div className="mt-3 flex flex-wrap items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAroundSelection("<strong>", "</strong>")}
                title="Gras"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAroundSelection("<em>", "</em>")}
                title="Italique"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertLink}
                title="Lien"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAroundSelection("<h2>", "</h2>")}
                title="Titre H2"
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  insertAroundSelection("<ul>\n  <li>", "</li>\n</ul>")
                }
                title="Liste"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={readOnly}
            className="mt-3 min-h-[400px] font-mono text-xs"
            placeholder="<h2>Titre</h2>&#10;<p>Bonjour {{prenom}}...</p>"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Utilisez{" "}
            <code className="rounded bg-zinc-100 px-1 text-zinc-700">
              {"{{prenom}}"}
            </code>
            ,{" "}
            <code className="rounded bg-zinc-100 px-1 text-zinc-700">
              {"{{nom}}"}
            </code>
            ,{" "}
            <code className="rounded bg-zinc-100 px-1 text-zinc-700">
              {"{{email}}"}
            </code>{" "}
            pour personnaliser. Ces variables seront remplacees a
            l&apos;envoi.
          </p>
        </div>
      </div>

      {/* COLONNE DROITE - Preview */}
      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Apercu de l&apos;email
            </h2>
            <p className="text-xs text-zinc-500">
              {totalDestinataires} destinataire
              {totalDestinataires > 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <iframe
              srcDoc={previewHtml}
              title="Apercu email"
              className="h-[640px] w-full bg-white"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Disponible au Prompt 22"
            >
              <Send className="mr-1.5 h-4 w-4" />
              Tester l&apos;envoi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
