"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  acompteError,
  computeAcompte,
  formatAmount,
  type AcompteMode,
  type QuoteAmounts,
} from "@/lib/documents"

export type ConvertibleQuote = QuoteAmounts & { id: string }

type ConvertBody =
  | { type: "standard" }
  | { type: "acompte"; mode: AcompteMode; value: number }
  | { type: "solde" }

// Appel unique a la route de conversion ; renvoie l'id de la facture creee
// ou leve une erreur avec le message du serveur
async function postConversion(quoteId: string, body: ConvertBody) {
  const r = await fetch(`/api/devis/${quoteId}/convertir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => null)
  if (!r.ok || !data || typeof data.id !== "string") {
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        "Conversion impossible."
    )
  }
  return data.id as string
}

function parseValue(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".")
  return cleaned === "" ? Number.NaN : Number(cleaned)
}

const radioClass = "h-4 w-4 accent-[#C8151B]"

// Conversion d'un devis accepte : facture complete ou facture d'acompte
// (pourcentage ou montant fixe). Partage par la liste et la page detail.
export function ConvertDialog({
  quote,
  open,
  onOpenChange,
}: {
  quote: ConvertibleQuote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [kind, setKind] = useState<"standard" | "acompte">("standard")
  const [mode, setMode] = useState<AcompteMode>("percent")
  const [raw, setRaw] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setKind("standard")
    setMode("percent")
    setRaw("")
    setError(null)
  }, [open])

  if (!quote) return null

  const value = parseValue(raw)
  const invalid =
    kind === "acompte" ? acompteError(quote, mode, value) : null
  const acompte =
    kind === "acompte" && !invalid ? computeAcompte(quote, mode, value) : null

  const submit = async () => {
    if (invalid) return
    setSubmitting(true)
    setError(null)
    try {
      const id = await postConversion(
        quote.id,
        kind === "acompte"
          ? { type: "acompte", mode, value }
          : { type: "standard" }
      )
      router.push(`/admin/devis-factures/${id}?kind=facture`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.")
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir en facture</DialogTitle>
          <DialogDescription>
            Devis {quote.reference}, total {formatAmount(quote.totalTtc)}. Le
            devis sera fige apres la conversion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-zinc-900">
              Type de facture
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="convert-kind"
                checked={kind === "standard"}
                onChange={() => setKind("standard")}
                className={radioClass}
              />
              Facture complete
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="convert-kind"
                checked={kind === "acompte"}
                onChange={() => setKind("acompte")}
                className={radioClass}
              />
              Facture d&apos;acompte
            </label>
          </fieldset>

          {kind === "acompte" && (
            <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="acompte-mode"
                    checked={mode === "percent"}
                    onChange={() => {
                      setMode("percent")
                      setRaw("")
                    }}
                    className={radioClass}
                  />
                  Pourcentage
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="acompte-mode"
                    checked={mode === "amount"}
                    onChange={() => {
                      setMode("amount")
                      setRaw("")
                    }}
                    className={radioClass}
                  />
                  Montant fixe
                </label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acompte-value">
                  {mode === "percent"
                    ? "Pourcentage du devis (1 a 99)"
                    : "Montant TTC de l'acompte (FCFA)"}
                </Label>
                <Input
                  id="acompte-value"
                  inputMode="decimal"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={mode === "percent" ? "30" : "250000"}
                  aria-invalid={Boolean(raw && invalid)}
                  aria-describedby="acompte-feedback"
                />
                <p
                  id="acompte-feedback"
                  className={
                    raw && invalid
                      ? "text-xs text-red-600"
                      : "text-xs text-zinc-600"
                  }
                >
                  {acompte
                    ? `Acompte : ${formatAmount(acompte.totalTtc)}. Reste a facturer : ${formatAmount(quote.totalTtc - acompte.totalTtc)}.`
                    : raw
                      ? invalid
                      : "Saisissez une valeur pour voir le montant de l'acompte."}
                </p>
              </div>
            </div>
          )}

          {kind === "standard" && (
            <p className="text-sm text-zinc-700">
              Facture de {formatAmount(quote.totalTtc)}, soit 100 % du devis.
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || Boolean(invalid)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {submitting ? "Creation..." : "Creer la facture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Facture de solde d'un devis converti : confirmation avec le montant calcule
// par soustraction (identique au serveur)
export function SoldeDialog({
  quoteId,
  quoteReference,
  amount,
  open,
  onOpenChange,
}: {
  quoteId: string
  quoteReference: string
  amount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const id = await postConversion(quoteId, { type: "solde" })
      router.push(`/admin/devis-factures/${id}?kind=facture`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.")
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Facturer le solde ?</DialogTitle>
          <DialogDescription>
            La facture de solde reprend les lignes du devis {quoteReference} et
            deduit l&apos;acompte deja facture.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-zinc-700">
          Montant du solde :{" "}
          <span className="font-semibold">{formatAmount(amount)}</span>
        </p>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {submitting ? "Creation..." : "Facturer le solde"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
