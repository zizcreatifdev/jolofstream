"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, ChevronLeft, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[devis-factures/[id]] erreur de chargement", error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto h-10 w-10 text-[#C8151B]" />
      <h1 className="mt-4 text-lg font-semibold text-zinc-900">
        Impossible de charger ce document
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Une erreur est survenue lors de la lecture en base. Reessayez dans un
        instant ; si le probleme persiste, consultez les logs du serveur.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-zinc-400">Code : {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#C8151B] text-white hover:bg-[#a01015]"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" /> Reessayer
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/devis-factures">
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Retour a la liste
          </Link>
        </Button>
      </div>
    </div>
  )
}
