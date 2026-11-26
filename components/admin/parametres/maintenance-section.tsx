"use client"

import { useState } from "react"
import { Loader2, Search, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatBytes } from "@/lib/image-profiles"

type Item = {
  id: string
  location: string
  profileLabel: string
  url: string
  size: number
  estimated: number
}
type Analysis = {
  items: Item[]
  errors: Array<{ location: string; error: string }>
  totalSize: number
  totalEstimated: number
}
type Result = { id: string; location: string; ok: boolean; before?: number; after?: number; error?: string }

const BATCH = 5

async function call<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/maintenance/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Erreur serveur")
  return data as T
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`
}

// Paramètres > Maintenance : rattrapage des images déjà en ligne. L'analyse
// est une simulation (rien n'est modifié) ; l'optimisation traite les images
// par lots de 5 côté serveur.
export function MaintenanceSection() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [failures, setFailures] = useState<Result[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    setAnalyzing(true)
    setError(null)
    setSummary(null)
    setFailures([])
    try {
      setAnalysis(await call<Analysis>({ action: "analyze" }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible")
    } finally {
      setAnalyzing(false)
    }
  }

  const optimize = async () => {
    if (!analysis) return
    setConfirmOpen(false)
    setRunning(true)
    setDone(0)
    setError(null)
    setSummary(null)
    const ids = analysis.items.map((i) => i.id)
    const failed: Result[] = []
    let optimized = 0
    let gain = 0
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH)
      try {
        const { results } = await call<{ results: Result[] }>({ action: "optimize", ids: batch })
        for (const r of results) {
          if (r.ok) {
            optimized++
            gain += (r.before ?? 0) - (r.after ?? 0)
          } else failed.push(r)
        }
      } catch (e) {
        // Lot en erreur : on continue avec les suivants
        const message = e instanceof Error ? e.message : "Erreur serveur"
        for (const id of batch) {
          failed.push({ id, location: analysis.items.find((it) => it.id === id)?.location ?? id, ok: false, error: message })
        }
      }
      setDone(Math.min(ids.length, i + BATCH))
      setFailures([...failed])
    }
    try {
      await call({ action: "finish", optimized, failed: failed.length, gainBytes: Math.max(0, gain) })
    } catch {
      // journal facultatif : le résultat reste affiché
    }
    setSummary(
      `${optimized} ${optimized > 1 ? "images optimisées" : "image optimisée"}, gain ${formatBytes(Math.max(0, gain))}${failed.length ? `, ${plural(failed.length, "ignorée")}` : ""}.`
    )
    setAnalysis(null)
    setRunning(false)
  }

  const total = analysis?.items.length ?? 0
  const percent = total ? Math.round((done / total) * 100) : 0

  return (
    <div>
      <div className="mb-6 border-b border-zinc-100 pb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Optimiser les images existantes</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Les nouvelles images sont optimisées à l&apos;envoi. Cet outil retrouve les images déjà en ligne plus lourdes
          que nécessaire (hero, savoir-faire, témoignages, équipe, avatars, portfolio, en-têtes de pages, signature) et
          les recompresse. L&apos;analyse ne modifie rien ; l&apos;ancien fichier n&apos;est supprimé qu&apos;après la mise
          à jour réussie de sa référence.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={analyze} disabled={analyzing || running} className="min-h-[44px]">
          {analyzing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />}
          {analyzing ? "Analyse en cours" : "Analyser"}
        </Button>
        {analysis && total > 0 && (
          <Button type="button" onClick={() => setConfirmOpen(true)} disabled={running} className="min-h-[44px]">
            <Wand2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {`Optimiser ${plural(total, "image")}`}
          </Button>
        )}
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {running && (
          <>
            <p className="text-sm font-medium text-zinc-700">
              Optimisation : {done} sur {total}
            </p>
            <div
              role="progressbar"
              aria-label="Optimisation des images"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 max-w-md overflow-hidden rounded-full bg-zinc-200"
            >
              <div className="h-full bg-zinc-900 transition-[width] duration-200" style={{ width: `${percent}%` }} />
            </div>
          </>
        )}
        {summary && <p className="text-sm font-medium text-emerald-700">{summary}</p>}
        {analysis && !running && (
          <p className="text-sm text-zinc-700">
            {total === 0
              ? "Aucune image à optimiser : toutes les images sont déjà sous leur poids cible."
              : `${plural(total, "image")} au-dessus de la cible : ${formatBytes(analysis.totalSize)} aujourd'hui, environ ${formatBytes(analysis.totalEstimated)} après traitement.`}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {analysis && total > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Images au-dessus de leur poids cible</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-600">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Emplacement</th>
                <th scope="col" className="px-3 py-2 font-medium">Profil</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Taille actuelle</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Après traitement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {analysis.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-zinc-900">{item.location}</td>
                  <td className="px-3 py-2 text-zinc-600">{item.profileLabel}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-900">{formatBytes(item.size)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-900">{formatBytes(item.estimated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysis && analysis.errors.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-zinc-900">Images non analysées</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {analysis.errors.map((e) => (
              <li key={e.location}>
                {e.location} : {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {failures.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-zinc-900">Images ignorées</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {failures.map((f) => (
              <li key={f.id}>
                {f.location} : {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Optimiser ${plural(total, "image")} ?`}</DialogTitle>
            <DialogDescription>
              {analysis
                ? `Gain estimé : ${formatBytes(Math.max(0, analysis.totalSize - analysis.totalEstimated))}. Les fichiers sont remplacés par leur version optimisée ; les anciens sont supprimés une fois la référence mise à jour.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} className="min-h-[44px]">
              Annuler
            </Button>
            <Button type="button" onClick={optimize} className="min-h-[44px]">
              Optimiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
