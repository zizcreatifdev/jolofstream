import type { Metadata } from "next"

import { PageHero } from "@/components/public/page-hero"
import { AboutStatsGrid } from "@/components/public/about-stats"

export const metadata: Metadata = {
  title: "A propos",
  description:
    "Histoire, mission, valeurs, equipe et chiffres cles de Jolof Stream, agence senegalaise de captation et streaming live.",
}

// Editable depuis Parametres -> Contenu du site -> Page A propos au Prompt 11
const values = [
  {
    title: "Excellence technique",
    description:
      "Materiel professionnel et qualite HD garantie sur chaque production.",
  },
  {
    title: "Proximite",
    description:
      "Nous comprenons le contexte local et les enjeux de chaque evenement.",
  },
  {
    title: "Fiabilite",
    description:
      "Presence le jour J, backup systematique, zero defaillance toleree.",
  },
  {
    title: "Innovation",
    description:
      "Veille permanente sur les nouvelles technologies de diffusion.",
  },
]

// Remplace par vraies donnees depuis Parametres au Prompt 11
const team = [
  {
    initials: "CA",
    name: "Prenom Nom",
    role: "Cofondateur & Directeur technique",
    description:
      "Architecte des regies de diffusion. Plus de 10 ans d'experience sur le terrain.",
  },
  {
    initials: "CB",
    name: "Prenom Nom",
    role: "Cofondateur & Directeur creatif",
    description:
      "Pilote la creation editoriale et la direction artistique des productions.",
  },
]

export default function AProposPage() {
  return (
    <>
      <PageHero
        title="A propos de Jolof Stream"
        subtitle="Une agence senegalaise specialisee dans la captation et la diffusion en direct d'evenements sur le web."
      />

      <section className="bg-white py-24">
        {/* Editable depuis Parametres -> Page A propos au Prompt 11 */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Notre histoire
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-700">
            <p>
              Jolof Stream est nee de la conviction que chaque evenement
              merite d&apos;etre partage avec le monde. Fondes a Dakar par
              deux passionnes de technologie et de creation, nous avons
              construit une agence qui allie expertise technique et
              sensibilite multiculturelle.
            </p>
            <p>
              Notre mission est simple : transformer vos evenements en
              experiences digitales memorables, accessibles partout dans le
              monde en temps reel.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Notre mission
          </h2>
          <p className="mt-6 text-base leading-relaxed text-zinc-700 md:text-lg">
            Democratiser l&apos;acces aux evenements en direct en offrant des
            solutions de captation et de diffusion professionnelles,
            accessibles et adaptees au contexte africain.
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
            {values.map((value) => (
              <div
                key={value.title}
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
        {/* Remplace par vraies donnees depuis Parametres au Prompt 11 */}
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
            {team.map((member) => (
              <article
                key={member.name + member.role}
                className="flex flex-col items-center rounded-xl border border-zinc-100 bg-white p-8 text-center shadow-sm"
              >
                <div
                  aria-hidden
                  className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-200 text-3xl font-bold text-zinc-500"
                >
                  {member.initials}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#C8151B]">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {member.description}
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
            <AboutStatsGrid />
          </div>
        </div>
      </section>
    </>
  )
}
