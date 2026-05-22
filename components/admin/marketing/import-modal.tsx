"use client"

import { useState } from "react"
import Papa from "papaparse"
import { Download, FileText, Upload } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LISTES_PREDEFINIES,
  IMPORT_MAX_ROWS,
  getListeLabel,
} from "@/lib/marketing"
import { cn } from "@/lib/utils"

type ParsedRow = {
  email: string
  firstName?: string
  lastName?: string
  lists?: string[]
}

type ImportResult = {
  importes: number
  mis_a_jour: number
  erreurs: number
  details: string[]
}

const SAMPLE_CSV = `email;prenom;nom;listes
contact@example.com;Aida;Diop;clients|vip
john@example.com;John;Doe;prospects
`

function downloadSample() {
  const blob = new Blob(["﻿" + SAMPLE_CSV], {
    type: "text/csv;charset=utf-8",
  })
  const link = document.createElement("a")
  const href = URL.createObjectURL(blob)
  link.href = href
  link.download = "contacts-exemple.csv"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(href)
}

export function ImportModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: () => void
}) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [extraLists, setExtraLists] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const reset = () => {
    setRows([])
    setFileName(null)
    setParseError(null)
    setExtraLists([])
    setResult(null)
  }

  const onFile = (file: File) => {
    setParseError(null)
    setResult(null)
    setFileName(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedRow[] = []
        for (const row of results.data) {
          const emailRaw = row.email || row.Email || row.EMAIL
          if (!emailRaw) continue
          const listesRaw =
            row.listes ||
            row.Listes ||
            row.lists ||
            row.Lists ||
            row.LISTES ||
            ""
          const lists = listesRaw
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
          parsed.push({
            email: emailRaw.trim(),
            firstName: row.prenom || row.Prenom || row.firstName || "",
            lastName: row.nom || row.Nom || row.lastName || "",
            lists,
          })
        }
        if (parsed.length === 0) {
          setParseError(
            "Aucune ligne valide trouvee. Verifiez l'en-tete (email, prenom, nom, listes)."
          )
          setRows([])
          return
        }
        if (parsed.length > IMPORT_MAX_ROWS) {
          setParseError(
            `Maximum ${IMPORT_MAX_ROWS} contacts par import (${parsed.length} dans le fichier).`
          )
          setRows([])
          return
        }
        setRows(parsed)
      },
      error: (err: Error) => {
        setParseError(err.message)
        setRows([])
      },
    })
  }

  const toggleExtraList = (l: string) => {
    setExtraLists((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    )
  }

  const submit = async () => {
    if (rows.length === 0) return
    setSubmitting(true)
    setResult(null)
    try {
      const payload = {
        contacts: rows.map((r) => ({
          ...r,
          lists: Array.from(new Set([...(r.lists ?? []), ...extraLists])),
        })),
      }
      const r = await fetch("/api/marketing/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await r.json().catch(() => null)) as
        | ImportResult
        | { error: string }
        | null
      if (!r.ok || !data || "error" in data) {
        setParseError(
          (data && "error" in data && data.error) ||
            "Echec de l'import"
        )
        return
      }
      setResult(data)
      onImported()
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des contacts CSV</DialogTitle>
          <DialogDescription>
            Format CSV attendu : colonnes <strong>email</strong>,{" "}
            <strong>prenom</strong>, <strong>nom</strong>,{" "}
            <strong>listes</strong> (separees par |). Separateur ; ou ,.
            Maximum {IMPORT_MAX_ROWS} contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-zinc-700">
              <FileText className="h-4 w-4" /> Telecharger un exemple
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSample}
            >
              <Download className="mr-1.5 h-4 w-4" /> Exemple CSV
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-file">Fichier CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
              }}
            />
            {fileName && (
              <p className="text-xs text-zinc-500">
                Fichier selectionne : {fileName} - {rows.length} ligne
                {rows.length > 1 ? "s" : ""} detectee
                {rows.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {parseError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {parseError}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="space-y-1.5">
                <Label>
                  Listes a ajouter a tous les contacts importes (optionnel)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LISTES_PREDEFINIES.map((l) => {
                    const active = extraLists.includes(l)
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleExtraList(l)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium",
                          active
                            ? "border-[#C8151B] bg-[#C8151B] text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        {getListeLabel(l)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-md border border-zinc-200">
                <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Apercu (5 premieres lignes)
                </div>
                <ul className="divide-y divide-zinc-100">
                  {rows.slice(0, 5).map((row, i) => (
                    <li key={i} className="px-3 py-2 text-sm">
                      <span className="font-mono text-zinc-900">
                        {row.email}
                      </span>
                      <span className="ml-2 text-xs text-zinc-500">
                        {row.firstName} {row.lastName}{" "}
                        {row.lists && row.lists.length > 0
                          ? `- listes : ${row.lists.join(", ")}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {result && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Import termine</p>
              <ul className="mt-1 list-disc pl-5 text-xs">
                <li>{result.importes} nouveaux contacts</li>
                <li>{result.mis_a_jour} contacts mis a jour</li>
                <li>{result.erreurs} erreurs</li>
              </ul>
              {result.details.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer">
                    Voir les details
                  </summary>
                  <ul className="mt-1 list-disc pl-5">
                    {result.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Fermer
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || rows.length === 0 || result !== null}
            className="bg-[#C8151B] text-white hover:bg-[#a01015]"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {submitting
              ? "Import..."
              : `Importer ${rows.length} contact${rows.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
