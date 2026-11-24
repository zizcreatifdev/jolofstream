import type { SessionPreview } from "@/lib/home-data"
import { CineButton } from "@/components/public/cine/primitives"

// Carte "Formations" des offres de l'accueil. Source actuelle : sessions
// TrainingSession ouvertes. Le prompt 3 la branchera sur les cohortes.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function sessionDate(iso: string | null): string {
  return iso ? DATE_FORMAT.format(new Date(iso)) : "Date à confirmer"
}

function placesText(left: number, max: number): string {
  if (left <= 0) return "Aucune place restante"
  return `${left} ${left > 1 ? "places restantes" : "place restante"} sur ${max}`
}

export function FormationsOfferCard({
  number,
  title,
  text,
  sessions,
}: {
  number: string
  title: string
  text: string
  sessions: SessionPreview[]
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
          Voir les sessions
        </CineButton>
      </div>
      <div className="min-w-0 flex-[1_1_380px]">
        {sessions.length === 0 ? (
          <p className="rounded-lg bg-white px-[22px] py-5 text-[16px] font-semibold shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
            Prochaines dates bientôt
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const left = Math.max(0, s.maxSeats - s.taken)
              const pct = s.maxSeats > 0 ? Math.round((s.taken / s.maxSeats) * 100) : 0
              return (
                <li
                  key={s.id}
                  className="rounded-lg bg-white px-[22px] py-5 shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <strong className="text-[17px]">{s.title}</strong>
                    <span className="text-[14px] text-[#5B4A46]">{sessionDate(s.dateStart)}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Places réservées : ${s.title}`}
                    aria-valuemin={0}
                    aria-valuemax={s.maxSeats}
                    aria-valuenow={s.taken}
                    className="my-3 h-1.5 overflow-hidden rounded-full bg-[rgba(128,128,128,0.18)]"
                  >
                    <span className="block h-full rounded-full bg-cine-red" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[14px] text-[#5B4A46]">
                    {placesText(left, s.maxSeats)} · {s.location}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </article>
  )
}
