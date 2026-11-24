import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { placesLeftText, type CohortPublicStatus } from "@/lib/cohort-public"
import { CineButton } from "@/components/public/cine/primitives"

// Prochaine cohorte visible (tous programmes) pour la carte Formations
export type HomeCohort = {
  id: string
  programSlug: string
  name: string
  datesLabel: string
  dateStart: string | null
  location: string
  maxSeats: number
  taken: number
  left: number
  status: CohortPublicStatus
  statusLabel: string
}

const STATUS_TONE: Record<CohortPublicStatus, string> = {
  open: "bg-cine-cream2 text-[#6B5753]",
  soon: "bg-cine-red/10 text-cine-red",
  full: "bg-cine-ink text-white",
}

// Carte "Formations" des offres de l'accueil : les 2 prochaines cohortes
// visibles, chacune menant au tunnel de reservation
export function FormationsOfferCard({
  number,
  title,
  text,
  cohorts,
}: {
  number: string
  title: string
  text: string
  cohorts: HomeCohort[]
}) {
  return (
    <article className="flex min-h-[560px] flex-wrap items-start gap-12 rounded-[10px] bg-cine-cream p-[clamp(28px,4vw,64px)] text-cine-ink lg:sticky lg:top-[166px]">
      <div className="min-w-0 flex-[1_1_380px]">
        <p className="font-mono text-[13px] font-semibold tracking-[0.14em] text-cine-red">
          {number} · FORMATIONS
        </p>
        <h3 className="mb-[22px] mt-4 font-display text-[clamp(52px,6.6vw,104px)] font-normal leading-[0.92] tracking-[-0.025em]">
          {title}
        </h3>
        {text && <p className="mb-[30px] max-w-[520px] text-[17px] leading-[1.7] text-[#5B4A46]">{text}</p>}
        <CineButton href="/formations" variant="outLight" arrow>
          Voir les cohortes
        </CineButton>
      </div>
      <div className="min-w-0 flex-[1_1_380px]">
        {cohorts.length === 0 ? (
          <p className="rounded-lg bg-white px-[22px] py-5 text-[16px] font-semibold shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
            Prochaines dates bientôt
          </p>
        ) : (
          <ul className="space-y-3">
            {cohorts.map((c) => {
              const pct = c.maxSeats > 0 ? Math.min(100, Math.round((c.taken / c.maxSeats) * 100)) : 0
              return (
                <li key={c.id}>
                  <Link
                    href={`/formations/reserver?f=${encodeURIComponent(c.programSlug)}&c=${encodeURIComponent(c.id)}`}
                    className="block rounded-lg bg-white px-[22px] py-5 shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(26,17,16,0.2)]"
                  >
                    <span className="flex flex-wrap items-start justify-between gap-3">
                      <strong className="text-[17px]">{c.name}</strong>
                      <span
                        className={cn(
                          "rounded-md px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.08em]",
                          STATUS_TONE[c.status]
                        )}
                      >
                        {c.statusLabel}
                      </span>
                    </span>
                    <span className="mt-1 block text-[14px] text-[#5B4A46]">
                      {c.datesLabel} · {c.location}
                    </span>
                    <span
                      role="progressbar"
                      aria-label={`Places réservées : ${c.name}`}
                      aria-valuemin={0}
                      aria-valuemax={c.maxSeats}
                      aria-valuenow={Math.min(c.taken, c.maxSeats)}
                      className="my-3 block h-1.5 overflow-hidden rounded-full bg-[rgba(128,128,128,0.18)]"
                    >
                      <span className="block h-full rounded-full bg-cine-red" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="flex items-center justify-between gap-3 text-[14px] text-[#5B4A46]">
                      {placesLeftText(c.left, c.maxSeats)}
                      <span className="inline-flex items-center gap-1.5 font-semibold text-cine-red">
                        {c.status === "full" ? "Liste d'attente" : "Réserver"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </article>
  )
}
