import type { Metadata } from "next"
import Link from "next/link"
import { Check, Clapperboard, Radio, UserRound } from "lucide-react"

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
      "10 a 15 videos montees",
      "Coaching de cadrage et lumiere",
      "Livraison sur Drive securise",
    ],
  },
  {
    name: "Weekend Collab",
    price: "Sur devis",
    includes: [
      "2 jours de tournage avec 3 createurs",
      "20 a 30 videos montees",
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

type ServiceFeature = {
  id: string
  category: string
  title: string
  description: string
  Icon: typeof Radio
  accent: "red" | "ink" | "zinc"
  points: string[]
  steps: string[]
  anchor: string
}

const SERVICES: ServiceFeature[] = [
  {
    id: "captation-streaming-live",
    category: "Diffusion en direct",
    title: "Captation & Streaming Live",
    description:
      "Production HD multi-cameras et diffusion en direct sur toutes les plateformes : YouTube, Facebook, LinkedIn, sites prives. Regie complete et equipe experimentee.",
    Icon: Radio,
    accent: "red",
    points: [
      "Captation 2 a 4 cameras HD ou 4K",
      "Regie multi-sources avec habillage graphique",
      "Diffusion multi-plateformes simultanee",
      "Enregistrement complet et replay archive",
    ],
    steps: [
      "Briefing et preparation",
      "Installation sur site",
      "Diffusion en direct",
      "Livraison des masters",
    ],
    anchor: "#contact-cta",
  },
  {
    id: "ceo-content-package",
    category: "Image de marque",
    title: "CEO Content Package",
    description:
      "Construisez votre image de dirigeant avec des contenus video professionnels mensuels. Format clef en main, du tournage a la publication.",
    Icon: UserRound,
    accent: "ink",
    points: [
      "Sessions de tournage mensuelles",
      "Capsules video montees et sous-titrees",
      "Coaching de prise de parole",
      "Publication reseaux optionnelle",
    ],
    steps: [
      "Consultation mensuelle",
      "Tournage",
      "Montage et livraison",
      "Publication optionnelle",
    ],
    anchor: "#forfaits-ceo",
  },
  {
    id: "creator-weekend",
    category: "Production intensive",
    title: "Creator Weekend",
    description:
      "Un week-end entier dedie a la creation de votre contenu. Tournage intensif, montage et livraison de tous les livrables en une session.",
    Icon: Clapperboard,
    accent: "zinc",
    points: [
      "2 jours de tournage intensif",
      "10 a 30 livrables prets a publier",
      "Studio mobile avec eclairage cinema",
      "Coaching de cadrage et lumiere",
    ],
    steps: [
      "Preparation du concept",
      "Tournage 2 jours",
      "Montage",
      "Livraison",
    ],
    anchor: "#forfaits-creator",
  },
]

const ACCENT_BG: Record<ServiceFeature["accent"], string> = {
  red: "bg-[#C8151B]",
  ink: "bg-[#161110]",
  zinc: "bg-zinc-800",
}

function ServiceCard({ service }: { service: ServiceFeature }) {
  const { Icon } = service
  return (
    <article className="overflow-hidden rounded-card border border-zinc-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div
          className={`relative flex flex-col justify-between gap-8 p-8 text-white md:col-span-2 ${ACCENT_BG[service.accent]}`}
        >
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              {service.category}
            </span>
          </div>
          <Icon className="h-16 w-16" strokeWidth={1.25} />
        </div>

        <div className="p-8 md:col-span-3">
          <h3 className="font-display text-2xl font-normal tracking-tight text-ink">
            {service.title}
          </h3>
          <p className="mt-3 text-[15px] font-light leading-relaxed text-ink-2">
            {service.description}
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {service.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8151B]"
                />
                <span className="text-sm text-ink-2">{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-zinc-100 pt-5">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
              {service.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-soft text-xs font-bold text-[#C8151B]">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-ink-3">
                    {step}
                  </span>
                  {index < service.steps.length - 1 && (
                    <span aria-hidden className="text-ink-4">
                      &middot;
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <Link
            href={service.anchor}
            className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
          >
            Voir les forfaits
          </Link>
        </div>
      </div>
    </article>
  )
}

function ForfaitCard({ forfait }: { forfait: Forfait }) {
  const dark = Boolean(forfait.highlighted)
  return (
    <article
      className={`relative flex h-full flex-col rounded-card p-8 shadow-sm ${
        dark
          ? "bg-[#161110] text-white"
          : "border border-zinc-200 bg-white text-ink"
      }`}
    >
      {dark && (
        <span className="absolute right-6 top-6 inline-flex rounded-full bg-[#F5B800] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
          Recommande
        </span>
      )}
      <span
        className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
          dark ? "bg-[#F5B800] text-zinc-900" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {forfait.name}
      </span>
      <p
        className={`mt-4 font-display text-3xl tracking-tight ${
          dark ? "text-[#F5B800]" : "text-[#C8151B]"
        }`}
      >
        {forfait.price}
      </p>
      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {forfait.includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                dark ? "text-[#F5B800]" : "text-[#C8151B]"
              }`}
            />
            <span className={dark ? "text-white/85" : "text-ink-2"}>
              {item}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/contact"
        className={`mt-8 inline-flex items-center justify-center rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors ${
          dark
            ? "bg-[#F5B800] text-zinc-900 hover:bg-[#e0a800]"
            : "bg-[#C8151B] text-white hover:bg-[#a01015]"
        }`}
      >
        Demander un devis
      </Link>
    </article>
  )
}

function ForfaitsSection({
  id,
  title,
  subtitle,
  forfaits,
  background,
}: {
  id: string
  title: string
  subtitle: string
  forfaits: Forfait[]
  background: "white" | "cream"
}) {
  return (
    <section
      id={id}
      className={background === "cream" ? "bg-cream-2 py-24" : "bg-white py-24"}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-normal tracking-tight text-ink md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-ink-3">{subtitle}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {forfaits.map((f) => (
            <ForfaitCard key={f.name} forfait={f} />
          ))}
        </div>
      </div>
    </section>
  )
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

      <section className="bg-cream py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      <ForfaitsSection
        id="forfaits-ceo"
        title="CEO Content Package - Forfaits"
        subtitle="Deux formules pour construire votre presence de dirigeant, du tournage a la publication."
        forfaits={ceoForfaits}
        background="white"
      />

      <ForfaitsSection
        id="forfaits-creator"
        title="Creator Weekend - Forfaits"
        subtitle="Un week-end de production intensive, en solo ou en collaboration."
        forfaits={creatorForfaits}
        background="cream"
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-card border-2 border-[#F5B800] bg-[#FFF3C0] p-8 md:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <span className="inline-flex rounded-full bg-[#F5B800] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                  Add-on
                </span>
                <h2 className="mt-4 font-display text-2xl font-normal tracking-tight text-ink">
                  Gestion publication reseaux
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  Confiez-nous la diffusion de vos contenus sur Instagram,
                  Facebook, LinkedIn et TikTok.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 text-sm text-ink-2 sm:grid-cols-2 lg:col-span-1">
                {[
                  "Strategie editoriale mensuelle",
                  "Formats par plateforme",
                  "Programmation et publication",
                  "Reporting des performances",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col items-start gap-3 lg:col-span-1 lg:items-end">
                <p className="font-display text-2xl tracking-tight text-ink">
                  Sur devis
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-[10px] bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
                >
                  Ajouter a mon devis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact-cta"
        className="bg-[#C8151B] py-24 text-white"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-normal tracking-tight md:text-4xl">
            Parlons de votre projet
          </h2>
          <p className="mt-4 text-base text-white/85 md:text-lg">
            Reponse sous 24h ouvrees. Devis detaille et transparent.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[10px] bg-white px-7 py-3.5 text-sm font-semibold text-[#C8151B] transition-colors hover:bg-zinc-100"
            >
              Demander un devis
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center rounded-[10px] border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Voir nos realisations
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
