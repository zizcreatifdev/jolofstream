import type { Metadata } from "next"

import { PageHero } from "@/components/public/page-hero"
import { AboutStatsGrid } from "@/components/public/about-stats"
import {
  parseJsonField,
  type AboutStat,
  type AboutTeamMember,
  type AboutValue,
} from "@/lib/parametres"

export const metadata: Metadata = {
  title: "A propos",
  description:
    "Jolof Stream, agence de captation et diffusion en direct basee a Dakar. Notre histoire, notre equipe, notre mission.",
}

export const revalidate = 60

const fallbackHistory =
  "Jolof Stream est nee de la conviction que chaque evenement merite d'etre partage avec le monde. Fondes a Dakar par deux passionnes de technologie et de creation, nous avons construit une agence qui allie expertise technique et sensibilite multiculturelle."

const fallbackMission =
  "Democratiser l'acces aux evenements en direct en offrant des solutions de captation et de diffusion professionnelles, accessibles et adaptees au contexte africain."

const fallbackValues: AboutValue[] = [
  {
    title: "Excellence technique",
    description: "Materiel professionnel et qualite HD garantie sur chaque production.",
  },
  {
    title: "Proximite",
    description: "Nous comprenons le contexte local et les enjeux de chaque evenement.",
  },
  {
    title: "Fiabilite",
    description: "Presence le jour J, backup systematique, zero defaillance toleree.",
  },
  {
    title: "Innovation",
    description: "Veille permanente sur les nouvelles technologies de diffusion.",
  },
]

const fallbackTeam: AboutTeamMember[] = [
  {
    firstName: "Prenom",
    lastName: "Nom",
    role: "Cofondateur & Directeur technique",
    bio: "Architecte des regies de diffusion. Plus de 10 ans d'experience sur le terrain.",
    avatarUrl: "",
  },
  {
    firstName: "Prenom",
    lastName: "Nom",
    role: "Cofondateur & Directeur creatif",
    bio: "Pilote la creation editoriale et la direction artistique des productions.",
    avatarUrl: "",
  },
]

const fallbackStats: AboutStat[] = [
  { value: "50+", label: "evenements diffuses" },
  { value: "3", label: "plateformes simultanees" },
  { value: "HD", label: "qualite garantie" },
  { value: "2026", label: "annee de lancement" },
]

function initials(firstName: string, lastName: string) {
  const a = firstName?.[0] ?? ""
  const b = lastName?.[0] ?? ""
  return (a + b).toUpperCase() || "JS"
}

async function getAboutParams() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(
      `${baseUrl}/api/parametres?keys=about_history,about_mission,about_values,about_team,about_stats`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    return (await res.json()) as Record<string, string>
  } catch {
    return null
  }
}

export default async function AProposPage() {
  const params = (await getAboutParams()) ?? {}
  const history = params.about_history || fallbackHistory
  const mission = params.about_mission || fallbackMission
  const values = parseJsonField<AboutValue[]>(
    params.about_values,
    fallbackValues
  )
  const team = parseJsonField<AboutTeamMember[]>(
    params.about_team,
    fallbackTeam
  )
  const stats = parseJsonField<AboutStat[]>(params.about_stats, fallbackStats)

  return (
    <>
      <PageHero
        eyebrow="A propos"
        title='L&apos;agence de la <em class="italic text-[#F5B800]">diffusion live</em>.'
        subtitle="Une agence senegalaise specialisee dans la captation et la diffusion en direct d'evenements sur le web. Notre histoire, notre equipe, notre mission."
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Notre histoire
          </h2>
          <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
            {history}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Notre mission
          </h2>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-700 md:text-lg">
            {mission}
          </p>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Nos valeurs
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Les principes qui guident chaque production et chaque relation
              client.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <div
                key={`${value.title}-${i}`}
                className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-zinc-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              L&apos;equipe
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Deux cofondateurs aux profils complementaires, ensemble pour
              chaque projet.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {team.map((member, i) => (
              <article
                key={`${member.firstName}-${member.lastName}-${i}`}
                className="flex flex-col items-center rounded-xl border border-zinc-100 bg-white p-8 text-center shadow-sm"
              >
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="h-32 w-32 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-200 text-3xl font-bold text-zinc-500"
                  >
                    {initials(member.firstName, member.lastName)}
                  </div>
                )}
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#C8151B]">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {member.bio}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Jolof Stream en chiffres
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Nos resultats parlent pour nous.
            </p>
          </div>
          <div className="mt-12">
            <AboutStatsGrid items={stats} />
          </div>
        </div>
      </section>
    </>
  )
}
