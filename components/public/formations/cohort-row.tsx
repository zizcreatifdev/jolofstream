import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatFcfa, placesLeftText } from "@/lib/cohort-public"
import type { PublicCohort } from "@/lib/formations-public"

// Contenu d'une ligne de cohorte (maquette .coh), partage par la page
// /formations (lien) et le tunnel de reservation (bouton radio). Sans etat.
export const COHORT_ROW_CLASS =
  "grid w-full grid-cols-1 items-center gap-3 rounded-xl px-6 py-[22px] text-left text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgba(26,17,16,0.16),0_18px_40px_rgba(26,17,16,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 min-[761px]:grid-cols-[104px_minmax(0,1fr)_auto] min-[761px]:gap-[22px]"

export function cohortRowTone(cohort: PublicCohort, selected = false): string {
  return cn(
    cohort.status === "full" ? "bg-cine-cream2" : "bg-white",
    selected && "shadow-[inset_0_0_0_2px_#C8151B] hover:shadow-[inset_0_0_0_2px_#C8151B]"
  )
}

const STATUS_TONE = {
  open: "bg-cine-cream2 text-[#6B5753]",
  soon: "bg-cine-red/10 text-cine-red",
  full: "bg-cine-ink text-white",
} as const

export function CohortRowContent({
  cohort,
  actionLabel = "Choisir",
  headingLevel = "h4",
  waitlistNote = false,
}: {
  cohort: PublicCohort
  actionLabel?: string
  headingLevel?: "h3" | "h4" | "span"
  // Tunnel : mention sous une cohorte complete
  waitlistNote?: boolean
}) {
  const full = cohort.status === "full"
  const pct = cohort.maxSeats > 0 ? Math.min(100, Math.round((cohort.taken / cohort.maxSeats) * 100)) : 0
  const Title = headingLevel
  return (
    <>
      <span className="font-display text-[34px] leading-none tracking-[-0.02em]">
        {cohort.dayBadge ? cohort.dayBadge.day : "À venir"}
        {cohort.dayBadge && (
          <small className="mt-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6A5853]">
            {cohort.dayBadge.month}
          </small>
        )}
      </span>
      <span className="block min-w-0">
        <Title className="mb-1 block text-[17px] font-semibold">{cohort.name}</Title>
        <span className="block text-[13px] leading-[1.5] text-[#6B5753]">
          {cohort.datesLabel} · {cohort.location} · {formatFcfa(cohort.price)}
        </span>
        <span
          aria-hidden="true"
          className="mb-2 mt-3 block h-1.5 max-w-[300px] overflow-hidden rounded-full bg-[rgba(128,128,128,0.18)]"
        >
          <span className="block h-full rounded-full bg-cine-red" style={{ width: `${pct}%` }} />
        </span>
        <span className="flex flex-wrap items-center gap-2.5 text-[13px] text-[#6B5753]">
          <span>
            {full ? (
              placesLeftText(0, cohort.maxSeats)
            ) : (
              <>
                <b className="text-cine-ink">{cohort.left}</b>{" "}
                {cohort.left > 1 ? "places restantes" : "place restante"} sur {cohort.maxSeats}
              </>
            )}
          </span>
          <span
            className={cn(
              "inline-block rounded-md px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.08em]",
              STATUS_TONE[cohort.status]
            )}
          >
            {cohort.statusLabel}
          </span>
        </span>
        {full && waitlistNote && (
          <span className="mt-2 block text-[13px] font-semibold text-cine-ink">
            Vous serez inscrit en liste d&apos;attente
          </span>
        )}
      </span>
      <span
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap text-[14px] font-semibold",
          full ? "text-cine-ink" : "text-cine-red"
        )}
      >
        {full ? "Liste d'attente" : actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </>
  )
}
