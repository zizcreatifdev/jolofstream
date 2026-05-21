import type { Metadata } from "next"

import { PageHero } from "@/components/public/page-hero"
import {
  FormationsInscriptionForm,
  type FormationOption,
} from "@/components/public/formations-inscription-form"

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Sessions de formation ouvertes au public a Dakar : captation, streaming, production de contenus.",
}

// Sessions chargees depuis la DB - donnees statiques en attendant Prompt 09
const sessions = [
  {
    id: "session-initiation-juin-2026",
    title: "Initiation au Streaming Live",
    date: "14-15 juin 2026",
    location: "Dakar, Senegal",
    duration: "2 jours",
    seatsTaken: 12,
    seatsTotal: 20,
    price: "150 000 FCFA",
    description:
      "Decouvrez la captation multi-cameras, la regie de diffusion et les bonnes pratiques de production en direct.",
  },
  {
    id: "session-maitrise-juillet-2026",
    title: "Maitrise du Streaming Avance",
    date: "19-20 juillet 2026",
    location: "Dakar, Senegal",
    duration: "2 jours",
    seatsTaken: 0,
    seatsTotal: 20,
    price: "200 000 FCFA",
    description:
      "Allez plus loin : habillage graphique, multi-plateformes, moderation et analytics post-diffusion.",
  },
]

function badgeFor(seatsTaken: number, seatsTotal: number) {
  const remaining = seatsTotal - seatsTaken
  if (remaining <= 0) {
    return { label: "Complet", className: "bg-zinc-200 text-zinc-700" }
  }
  if (remaining / seatsTotal < 0.2) {
    return {
      label: "Bientot complet",
      className: "bg-[#F5B800] text-zinc-900",
    }
  }
  return { label: "Places disponibles", className: "bg-emerald-100 text-emerald-700" }
}

export default function FormationsPublicPage() {
  const formOptions: FormationOption[] = sessions.map((s) => ({
    id: s.id,
    label: `${s.title} - ${s.date}`,
    full: s.seatsTaken >= s.seatsTotal,
  }))

  return (
    <>
      <PageHero
        title="Formations Jolof Stream"
        subtitle="Maitrisez la captation et le streaming en direct. Formations pratiques a Dakar."
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Sessions disponibles
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Reservez votre place pour la prochaine session. Paiement
              securise via Wave Business apres reception du mail de
              confirmation.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {sessions.map((session) => {
              const badge = badgeFor(session.seatsTaken, session.seatsTotal)
              const percent =
                session.seatsTotal === 0
                  ? 0
                  : Math.round(
                      (session.seatsTaken / session.seatsTotal) * 100
                    )
              const remaining = session.seatsTotal - session.seatsTaken
              return (
                <article
                  key={session.id}
                  className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {session.title}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {session.description}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-600">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-zinc-400">
                        Date
                      </dt>
                      <dd className="mt-0.5 font-medium text-zinc-900">
                        {session.date}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-zinc-400">
                        Duree
                      </dt>
                      <dd className="mt-0.5 font-medium text-zinc-900">
                        {session.duration}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-zinc-400">
                        Lieu
                      </dt>
                      <dd className="mt-0.5 font-medium text-zinc-900">
                        {session.location}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-zinc-400">
                        Tarif
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#C8151B]">
                        {session.price}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full bg-[#C8151B] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {remaining > 0
                        ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} sur ${session.seatsTotal}`
                        : "Toutes les places sont reservees - inscription sur liste d'attente"}
                    </p>
                  </div>
                  <a
                    href="#inscription"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
                  >
                    S&apos;inscrire
                  </a>
                </article>
              )
            })}
          </div>

          <div className="mt-12 rounded-2xl border-2 border-[#F5B800] bg-[#F5B800]/20 p-6 md:p-8">
            <p className="text-sm leading-relaxed text-zinc-900 md:text-base">
              <span className="font-semibold">Aucun paiement sur ce site.</span>{" "}
              Apres votre inscription, vous recevrez un email avec le lien
              Wave Business pour regler votre inscription. Delai de paiement :
              48h.
            </p>
          </div>
        </div>
      </section>

      <section id="inscription" className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Formulaire d&apos;inscription
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Selectionnez la session souhaitee. Nous vous enverrons un email
            avec le lien de paiement Wave Business.
          </p>
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <FormationsInscriptionForm sessions={formOptions} />
          </div>
        </div>
      </section>
    </>
  )
}
