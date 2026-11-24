import Link from "next/link"
import { AlertTriangle, ChevronLeft } from "lucide-react"

import { ProgramsList } from "@/components/admin/formations/programs-list"
import { cohortDisplayName, formatPrice, formatShortDeadline } from "@/lib/formations"
import { listProgramsWithStats } from "@/lib/training-program-stats"
import { countOverdueHolds, listOverdueHolds } from "@/lib/training-holds"

export const dynamic = "force-dynamic"

export default async function FormationsPage({
  searchParams,
}: {
  searchParams: { filtre?: string }
}) {
  if (searchParams.filtre === "hors-delai") return <OverdueHolds />

  const [programs, overdue] = await Promise.all([
    listProgramsWithStats().catch(() => []),
    countOverdueHolds().catch(() => 0),
  ])
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Formations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Programmes (fiche, plaquette) et leurs cohortes : inscrits, paiements Wave, liste d&apos;attente.
        </p>
      </div>
      {overdue > 0 && (
        <Link
          href="/admin/formations?filtre=hors-delai"
          className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {overdue} réservation{overdue > 1 ? "s" : ""} hors délai de paiement : voir la liste
        </Link>
      )}
      <ProgramsList initial={programs} />
    </div>
  )
}

async function OverdueHolds() {
  const rows = await listOverdueHolds().catch(() => [])
  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin/formations"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour aux programmes
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Réservations hors délai</h1>
        <p className="text-sm text-zinc-500">
          Places réservées dont le délai de paiement est dépassé. Elles restent comptées : relancez,
          prolongez ou libérez la place depuis la cohorte.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
          Aucune réservation hors délai.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-sm text-zinc-500">
                  {cohortDisplayName(r.session)} · {formatPrice(r.session.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  Hors délai depuis le {r.holdExpiresAt ? formatShortDeadline(r.holdExpiresAt) : "?"}
                </span>
                <Link
                  href={`/admin/formations/${r.session.id}`}
                  className="text-sm font-medium text-[#C8151B] hover:underline"
                >
                  Ouvrir la cohorte
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
