import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { PageHero } from "@/components/public/page-hero"
import { JsonLd } from "@/components/public/json-ld"

export const metadata: Metadata = {
  title: "Nos services",
  description:
    "Captation & Streaming Live, CEO Content Package, Creator Weekend. Decouvrez toutes nos offres de production video professionnelle a Dakar.",
}

export const revalidate = 60

type Forfait = {
  name: string
  price: string
  includes: string[]
  highlighted?: boolean
}

type ServiceBlock = {
  id: string
  title: string
  description: string
  forfaits: Forfait[]
  steps: string[]
  background: "white" | "zinc"
}

type Offer = {
  id: string
  serviceType: string
  name: string
  price: number | null
  priceLabel: string | null
  features: string[]
  isPopular: boolean
  displayOrder: number
}

type Grouped = {
  ceo_content: Offer[]
  creator_weekend: Offer[]
}

const fallbackCeoForfaits: Forfait[] = [
  {
    name: "Forfait Essentiel",
    price: "Sur devis",
    includes: [
      "1 session de tournage par mois (2h)",
      "3 capsules video montees",
      "Livraison sur Drive securise",
      "Coaching de prise de parole",
    ],
  },
  {
    name: "Forfait Premium",
    price: "Sur devis",
    includes: [
      "2 sessions de tournage par mois",
      "8 capsules video montees",
      "Sous-titres et habillage graphique",
      "Publication sur reseaux incluse",
      "Reporting mensuel",
    ],
    highlighted: true,
  },
]

const fallbackCreatorForfaits: Forfait[] = [
  {
    name: "Weekend Solo",
    price: "Sur devis",
    includes: [
      "2 jours de tournage",
      "10 a 15 vidéos montees",
      "Coaching de cadrage et lumiere",
      "Livraison sur Drive securise",
    ],
  },
  {
    name: "Weekend Collab",
    price: "Sur devis",
    includes: [
      "2 jours de tournage avec 3 createurs",
      "20 a 30 vidéos montees",
      "Studio mobile avec eclairage cinema",
      "Session photo bonus",
      "Distribution cross-creators",
    ],
    highlighted: true,
  },
]

function formatOfferPrice(offer: Offer): string {
  if (offer.price === null || offer.price === undefined) return "Sur devis"
  const f =
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(offer.price) + " FCFA"
  return offer.priceLabel ? `${f} ${offer.priceLabel}` : f
}

function offersToForfaits(offers: Offer[]): Forfait[] {
  return offers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((o) => ({
      name: o.name,
      price: formatOfferPrice(o),
      includes: o.features,
      highlighted: o.isPopular,
    }))
}

async function getCatalogue(): Promise<Grouped | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/catalogue?active=true`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return (await res.json()) as Grouped
  } catch {
    return null
  }
}

export default async function ServicesPage() {
  const catalogue = await getCatalogue()

  const ceoForfaits =
    catalogue && catalogue.ceo_content.length > 0
      ? offersToForfaits(catalogue.ceo_content)
      : fallbackCeoForfaits

  const creatorForfaits =
    catalogue && catalogue.creator_weekend.length > 0
      ? offersToForfaits(catalogue.creator_weekend)
      : fallbackCreatorForfaits

  const services: ServiceBlock[] = [
    {
      id: "captation-streaming-live",
      title: "Captation & Streaming Live",
      description:
        "Production HD multi-cameras et diffusion en direct sur toutes les plateformes : YouTube, Facebook, LinkedIn, sites prives. Equipement professionnel, regie complete et equipe experimentee.",
      background: "white",
      forfaits: [
        {
          name: "Pack Standard",
          price: "Sur devis",
          includes: [
            "Captation 2 cameras HD",
            "Regie multi-sources",
            "Diffusion sur 1 plateforme",
            "Enregistrement complet HD",
            "Support technique le jour J",
          ],
        },
        {
          name: "Pack Premium",
          price: "Sur devis",
          includes: [
            "Captation 4 cameras HD ou 4K",
            "Regie complete avec habillage graphique",
            "Diffusion multi-plateformes",
            "Enregistrement complet et masters",
            "Replay archive haute definition",
            "Equipe renforcee, repetition incluse",
          ],
          highlighted: true,
        },
      ],
      steps: [
        "Briefing et preparation",
        "Installation technique sur site",
        "Diffusion en direct",
        "Livraison des enregistrements",
      ],
    },
    {
      id: "ceo-content-package",
      title: "CEO Content Package",
      description:
        "Construisez votre image de dirigeant avec des contenus video professionnels mensuels. Format clef en main, du tournage a la publication.",
      background: "zinc",
      forfaits: ceoForfaits,
      steps: [
        "Consultation mensuelle",
        "Tournage",
        "Montage et livraison",
        "Publication optionnelle",
      ],
    },
    {
      id: "creator-weekend",
      title: "Creator Weekend",
      description:
        "Un week-end entier dedie a la creation de votre contenu. Tournage intensif, montage et livraison de tous les livrables en une session.",
      background: "white",
      forfaits: creatorForfaits,
      steps: [
        "Preparation du concept",
        "Tournage 2 jours",
        "Montage",
        "Livraison",
      ],
    },
  ]

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Captation et streaming live",
          provider: {
            "@type": "Organization",
            name: "Jolof Stream",
          },
          areaServed: "SN",
          description:
            "Captation multi-cameras HD et diffusion en direct sur toutes les plateformes.",
        }}
      />
      <PageHero
        eyebrow="Services"
        title='Des prestations <em class="italic text-[#F5B800]">sur mesure</em>.'
        subtitle="Trois offres principales et un add-on dedie aux reseaux sociaux. Chaque prestation est adaptee aux besoins de votre evenement, de votre marque ou de vos contenus."
      />

      {services.map((service) => (
        <section
          key={service.id}
          id={service.id}
          className={
            service.background === "zinc" ? "bg-zinc-50 py-24" : "bg-white py-24"
          }
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                {service.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600 md:text-lg">
                {service.description}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {service.forfaits.map((forfait) => (
                <article
                  key={forfait.name}
                  className={`flex h-full flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                    forfait.highlighted
                      ? "border-[#C8151B] bg-white ring-1 ring-[#C8151B]"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <h3 className="text-xl font-semibold text-zinc-900">
                    {forfait.name}
                  </h3>
                  <p
                    className={`mt-2 text-3xl font-bold ${
                      forfait.highlighted ? "text-[#C8151B]" : "text-zinc-900"
                    }`}
                  >
                    {forfait.price}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-700">
                    {forfait.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            forfait.highlighted
                              ? "text-[#C8151B]"
                              : "text-zinc-500"
                          }`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`mt-8 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                      forfait.highlighted
                        ? "bg-[#C8151B] text-white hover:bg-[#a01015]"
                        : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Demander un devis
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-16">
              <h3 className="text-center text-lg font-semibold uppercase tracking-wider text-zinc-500">
                Notre processus
              </h3>
              <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {service.steps.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-xl border border-zinc-200 bg-white p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8151B] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-medium text-zinc-900">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-[#F5B800] bg-[#F5B800]/10 p-8 md:p-12">
            <span className="inline-flex rounded-full bg-[#F5B800] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Add-on
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Gestion publication reseaux
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-700 md:text-lg">
              Confiez-nous la diffusion de vos contenus sur Instagram, Facebook,
              LinkedIn et TikTok. Strategie editoriale, calendrier de
              publication, formats adaptes a chaque plateforme.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-zinc-800 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                <span>Strategie editoriale mensuelle</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                <span>Decoupage et formats par plateforme</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                <span>Programmation et publication</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                <span>Reporting mensuel des performances</span>
              </li>
            </ul>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-bold text-zinc-900">Sur devis</p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
              >
                Ajouter a mon devis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#C8151B] py-24 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Parlons de votre projet
          </h2>
          <p className="mt-4 text-base text-white/85 md:text-lg">
            Reponse sous 24h ouvrees. Devis detaille et transparent.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-[#C8151B] transition-colors hover:bg-zinc-100"
          >
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  )
}
