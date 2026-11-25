import type { Metadata } from "next"

import { getPublicProgramsSafe } from "@/lib/formations-public"
import { getPaymentDelayHours } from "@/lib/training-delay"
import { paymentDelayLabel } from "@/lib/cohort-public"
import { Kicker, PAD } from "@/components/public/cine/primitives"
import { ReservationWizard } from "@/components/public/formations/reservation-wizard"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Réserver une formation",
  description:
    "Choisissez votre formation et votre cohorte. Aucun paiement sur le site : le lien Wave Business arrive par email.",
  path: "/formations/reserver",
  index: false,
})

export const dynamic = "force-dynamic"

const UNAVAILABLE =
  "Cette cohorte n'est plus proposée (terminée, annulée ou retirée) : choisissez une autre date."

// Tunnel de reservation : donnees lues cote serveur, etapes dans le client.
// ?f = slug du programme, ?c = identifiant de la cohorte.
export default async function ReserverPage({
  searchParams,
}: {
  searchParams: { f?: string | string[]; c?: string | string[] }
}) {
  const [programs, delayHours] = await Promise.all([getPublicProgramsSafe(), getPaymentDelayHours()])
  const f = typeof searchParams.f === "string" ? searchParams.f : null
  const c = typeof searchParams.c === "string" ? searchParams.c : null

  let program = programs.find((p) => p.slug === f) ?? null
  if (!program && programs.length === 1) program = programs[0]
  let cohortId: string | null = null
  let notice: string | null = null
  if (program && c) {
    if (program.cohorts.some((cohort) => cohort.id === c)) cohortId = c
    else notice = UNAVAILABLE
  }

  return (
    <>
      <section className={`bg-black pb-[70px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <Kicker>Scène 03 · Réservation</Kicker>
          <h1 className="mt-[22px] font-display text-[clamp(56px,9vw,150px)] font-normal leading-[0.88] tracking-[-0.025em]">
            Réservez
            <br />
            <em className="italic text-cine-yellow">votre place.</em>
          </h1>
          <p className="mt-[22px] max-w-[560px] text-[18px] leading-[1.7] text-cine-cream/70">
            Choisissez la formation, puis la cohorte qui vous convient. Aucun paiement sur le site : votre lien
            Wave Business arrive par email.
          </p>
        </div>
      </section>
      <section className={`bg-cine-cream pb-[110px] pt-20 text-cine-ink ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <ReservationWizard
            programs={programs}
            delayLabel={paymentDelayLabel(delayHours)}
            initialSlug={program?.slug ?? null}
            initialCohortId={cohortId}
            notice={notice}
          />
        </div>
      </section>
    </>
  )
}
