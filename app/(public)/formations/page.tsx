import type { Metadata } from "next"
import Link from "next/link"

import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/formations"
import { PageHero } from "@/components/public/page-hero"
import { JsonLd } from "@/components/public/json-ld"
import {
  FormationsInscriptionForm,
  type FormationOption,
} from "@/components/public/formations-inscription-form"

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Formations pratiques au streaming live et a la captation video a Dakar. Sessions limitees, inscriptions ouvertes.",
}

export const revalidate = 60

type SessionView = {
  id: string
  title: string
  description: string | null
  dateStart: Date
  dateEnd: Date
  location: string
  maxSeats: number
  price: number
  status: string
  taken: number
}

async function getSessions(): Promise<SessionView[]> {
  try {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        status: { in: ["ouvert", "complet"] },
      },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["confirme", "en_attente"] } },
            },
          },
        },
      },
      orderBy: { dateStart: "asc" },
    })
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      dateStart: s.dateStart,
      dateEnd: s.dateEnd,
      location: s.location,
      maxSeats: s.maxSeats,
      price: s.price,
      status: s.status,
      taken: s._count.registrations,
    }))
  } catch {
    return []
  }
}

function formatDateRange(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric" })
  const fullFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  if (start.getTime() === end.getTime()) return fullFmt.format(start)
  if (sameMonth) {
    return `${dayFmt.format(start)}-${fullFmt.format(end)}`
  }
  return `${fullFmt.format(start)} - ${fullFmt.format(end)}`
}

function durationDays(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime()
  const days = Math.max(1, Math.round(ms / 86_400_000) + 1)
  return `${days} jour${days > 1 ? "s" : ""}`
}

function badgeFor(
  status: string,
  taken: number,
  total: number
): { label: string; className: string } {
  const remaining = total - taken
  if (status === "complet" || remaining <= 0) {
    return { label: "Complet", className: "bg-zinc-200 text-zinc-700" }
  }
  if (total > 0 && remaining / total < 0.2) {
    return { label: "Bientot complet", className: "bg-[#F5B800] text-zinc-900" }
  }
  return {
    label: "Places disponibles",
    className: "bg-emerald-100 text-emerald-700",
  }
}

export default async function FormationsPublicPage() {
  const sessions = await getSessions()

  const formOptions: FormationOption[] = sessions.map((s) => ({
    id: s.id,
    label: `${s.title} - ${formatDateRange(s.dateStart, s.dateEnd)}`,
    full: s.status === "complet" || s.taken >= s.maxSeats,
  }))

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Jolof Stream Formations",
          url: "https://jolofstream.com/formations",
          description:
            "Formations pratiques au streaming live et a la captation video a Dakar.",
        }}
      />
      <PageHero
        eyebrow="Formations"
        title='Maitrisez le <em class="italic text-[#F5B800]">streaming live</em>.'
        subtitle="Formations pratiques a Dakar, sessions limitees. Apprenez aux cotes de notre equipe sur du materiel professionnel."
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

          {sessions.length === 0 ? (
            <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <p className="text-base font-medium text-zinc-900">
                Aucune session disponible pour le moment.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Revenez bientot ou contactez-nous pour etre informe des
                prochaines dates.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
              >
                Nous contacter
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {sessions.map((session) => {
                const badge = badgeFor(
                  session.status,
                  session.taken,
                  session.maxSeats
                )
                const percent =
                  session.maxSeats === 0
                    ? 0
                    : Math.min(
                        100,
                        Math.round((session.taken / session.maxSeats) * 100)
                      )
                const remaining = Math.max(0, session.maxSeats - session.taken)
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
                    {session.description && (
                      <p className="mt-2 text-sm text-zinc-600">
                        {session.description}
                      </p>
                    )}
                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-600">
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-zinc-400">
                          Date
                        </dt>
                        <dd className="mt-0.5 font-medium text-zinc-900">
                          {formatDateRange(session.dateStart, session.dateEnd)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-zinc-400">
                          Duree
                        </dt>
                        <dd className="mt-0.5 font-medium text-zinc-900">
                          {durationDays(session.dateStart, session.dateEnd)}
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
                          {formatPrice(session.price)}
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
                          ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} sur ${session.maxSeats}`
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
          )}

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
            {formOptions.length > 0 ? (
              <FormationsInscriptionForm sessions={formOptions} />
            ) : (
              <p className="text-sm text-zinc-600">
                Aucune session ouverte aux inscriptions pour le moment.{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-[#C8151B] hover:underline"
                >
                  Contactez-nous
                </Link>{" "}
                pour etre informe des prochaines dates.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
