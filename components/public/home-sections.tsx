"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import {
  Briefcase,
  Camera,
  Star,
  Video,
  type LucideIcon,
} from "lucide-react"

const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
}

const heroItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,21,27,0.15),transparent_50%),radial-gradient(circle_at_80%_60%,rgba(245,184,0,0.08),transparent_50%)]" />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.div
            variants={heroItem}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Disponible pour vos evenements 2026
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            Capturez l&apos;instant,
            <br />
            <span className="italic text-[#C8151B]">
              diffusez l&apos;emotion.
            </span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl"
          >
            Jolof Stream transforme vos evenements en experiences digitales
            accessibles partout.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a01015]"
            >
              Demander un devis
            </Link>
            <Link
              href="/formations"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Voir les formations
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const bandItems = [
  "Captation multi-cameras HD",
  "Streaming multi-plateformes",
  "Habillage graphique",
  "Moderation & interaction",
]

export function ServiceBandSection() {
  return (
    <section className="bg-[#C8151B] py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex snap-x snap-mandatory gap-x-0 overflow-x-auto md:grid md:grid-cols-4 md:gap-0 md:overflow-visible">
          {bandItems.map((item, index) => (
            <li
              key={item}
              className={`flex shrink-0 snap-center items-center justify-center px-5 py-1 text-center text-sm font-medium uppercase tracking-wide text-white md:px-4 ${
                index < bandItems.length - 1 ? "md:border-r md:border-white/30" : ""
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const stats = [
  { value: "50+", label: "evenements diffuses" },
  { value: "3", label: "plateformes simultanees" },
  { value: "HD", label: "qualite garantie" },
  { value: "2026", label: "annee de lancement" },
]

export function AboutStatsSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Qui sommes-nous ?
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
            <p>
              Jolof Stream est une agence senegalaise specialisee dans la
              captation et la diffusion en direct d&apos;evenements sur le
              web. Basee a Dakar, nous associons expertise technique et
              sensibilite multiculturelle pour offrir des productions de
              niveau international.
            </p>
            <p>
              Notre mission : rendre vos moments forts accessibles a tous,
              partout, en temps reel. Conferences, ceremonies, lancements de
              produits, formations, podcasts video : nous transformons chaque
              evenement en experience digitale memorable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut" as const,
              }}
              className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-center"
            >
              <p className="text-4xl font-bold text-[#C8151B]">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

type ServiceCard = {
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
}

const featuredServices: ServiceCard[] = [
  {
    title: "Captation & Streaming Live",
    description:
      "Production HD multi-cameras avec diffusion en direct sur toutes les plateformes.",
    icon: Video,
    iconBg: "bg-[#C8151B]",
  },
  {
    title: "CEO Content Package",
    description:
      "Contenus video professionnels mensuels pour asseoir votre image de dirigeant.",
    icon: Briefcase,
    iconBg: "bg-zinc-900",
  },
  {
    title: "Creator Weekend",
    description:
      "Un week-end de tournage intensif pour produire tous vos contenus en une session.",
    icon: Camera,
    iconBg: "bg-[#C8151B]",
  },
]

export function FeaturedServicesSection() {
  return (
    <section className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Nos services
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Trois offres complementaires pour donner de la voix a vos
            evenements, votre marque personnelle et vos contenus.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredServices.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className="group rounded-xl bg-white p-8 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${service.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {service.description}
                </p>
                <Link
                  href="/services"
                  className="mt-6 inline-flex items-center text-sm font-semibold text-[#C8151B] transition-colors hover:text-[#a01015]"
                >
                  Decouvrir
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type PortfolioPreviewItem = {
  id?: string
  type: string
  title: string
  description: string
  thumbnailUrl?: string | null
}

const fallbackPortfolioPreview: PortfolioPreviewItem[] = [
  {
    type: "Streaming Live",
    title: "Conference Tech Dakar 2026",
    description: "Diffusion multi-plateformes, 4 cameras, 6h de live.",
  },
  {
    type: "CEO Content",
    title: "Serie Leadership",
    description: "12 capsules video mensuelles pour un dirigeant fintech.",
  },
  {
    type: "Creator Weekend",
    title: "Lancement marque mode",
    description: "Weekend de tournage, 25 livrables prets pour Instagram.",
  },
  {
    type: "Streaming Live",
    title: "Gala associatif",
    description: "Streaming HD bilingue, regie complete, replay archive.",
  },
  {
    type: "CEO Content",
    title: "Podcast entreprise",
    description: "Studio mobile, 10 episodes, distribution clef en main.",
  },
]

const portfolioTypeColor: Record<string, string> = {
  "Streaming Live": "bg-[#C8151B] text-white",
  "CEO Content": "bg-zinc-900 text-white",
  "Creator Weekend": "bg-[#F5B800] text-zinc-900",
  Formations: "bg-emerald-600 text-white",
}

const portfolioTypeLabel: Record<string, string> = {
  streaming_live: "Streaming Live",
  ceo_content: "CEO Content",
  creator_weekend: "Creator Weekend",
  formations: "Formations",
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v")
    const m = parsed.pathname.match(/^\/(embed|shorts)\/([^/?]+)/)
    return m ? m[2] : null
  } catch {
    return null
  }
}

export function PortfolioPreviewSection() {
  const [items, setItems] = useState<PortfolioPreviewItem[]>(
    fallbackPortfolioPreview
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch("/api/portfolio?published=true&limit=5", {
          cache: "no-store",
        })
        if (!r.ok) return
        const data = (await r.json()) as Array<{
          id: string
          title: string
          type: keyof typeof portfolioTypeLabel
          description: string | null
          mediaType: "photo" | "youtube"
          mediaUrl: string
        }>
        if (cancelled || !Array.isArray(data) || data.length === 0) return
        setItems(
          data.map((it) => {
            let thumb: string | null = null
            if (it.mediaType === "youtube") {
              const id = extractYoutubeId(it.mediaUrl)
              if (id) thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
            } else {
              thumb = it.mediaUrl
            }
            return {
              id: it.id,
              type: portfolioTypeLabel[it.type] ?? it.type,
              title: it.title,
              description: it.description ?? "",
              thumbnailUrl: thumb,
            }
          })
        )
      } catch {
        // garde le fallback
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bg-white py-24">
      {/* Donnees remplacees par les vraies realisations depuis la DB au Prompt 10 */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Nos realisations
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Un apercu des projets recents livres par Jolof Stream.
            </p>
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center text-sm font-semibold text-[#C8151B] transition-colors hover:text-[#a01015]"
          >
            Voir tout le portfolio
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id ?? item.title}
              className={`overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md ${
                index === 4 ? "lg:col-start-3" : ""
              }`}
            >
              <div
                aria-hidden
                className="flex h-60 items-center justify-center bg-zinc-200 text-xs uppercase tracking-wider text-zinc-400"
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src.includes("maxresdefault")) {
                        img.src = img.src.replace("maxresdefault", "hqdefault")
                      } else {
                        img.style.display = "none"
                      }
                    }}
                  />
                ) : (
                  "Image a venir"
                )}
              </div>
              <div className="p-5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    portfolioTypeColor[item.type] ?? "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {item.type}
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const trainingPreview = [
  {
    title: "Streaming Live : de la captation a la diffusion",
    date: "14 - 15 juin 2026",
    location: "Dakar",
    seatsTaken: 12,
    seatsTotal: 20,
    price: "150 000 FCFA",
  },
  {
    title: "Creator Weekend : production de contenus en 48h",
    date: "5 - 7 juillet 2026",
    location: "Dakar",
    seatsTaken: 8,
    seatsTotal: 15,
    price: "220 000 FCFA",
  },
]

export function FormationsPreviewSection() {
  return (
    <section className="bg-zinc-950 py-24 text-white">
      {/* Donnees remplacees par les vraies sessions depuis la DB au Prompt 09 */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Prochaines formations
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Apprenez aux cotes de notre equipe sur du materiel professionnel.
            </p>
          </div>
          <Link
            href="/formations"
            className="inline-flex items-center text-sm font-semibold text-[#F5B800] transition-colors hover:text-white"
          >
            Voir toutes les sessions
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {trainingPreview.map((session) => {
            const percent = Math.round(
              (session.seatsTaken / session.seatsTotal) * 100
            )
            return (
              <article
                key={session.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <h3 className="text-lg font-semibold">{session.title}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-400">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Date
                    </dt>
                    <dd className="mt-0.5 text-zinc-200">{session.date}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Lieu
                    </dt>
                    <dd className="mt-0.5 text-zinc-200">{session.location}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Places
                    </dt>
                    <dd className="mt-0.5 text-zinc-200">
                      {session.seatsTaken}/{session.seatsTotal} places
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Tarif
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[#F5B800]">
                      {session.price}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-[#C8151B]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {percent}% des places reservees
                  </p>
                </div>
                <Link
                  href="/formations"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
                >
                  S&apos;inscrire
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type Testimonial = {
  initials: string
  name: string
  organization: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    initials: "AT",
    name: "Aminata Toure",
    organization: "Directrice marketing, Fintech Dakar",
    quote:
      "Jolof Stream a transforme notre conference annuelle en un evenement vu par toute la diaspora. Production impeccable et equipe a l'ecoute.",
  },
  {
    initials: "OS",
    name: "Ousmane Sow",
    organization: "Fondateur, Studio Baobab",
    quote:
      "Le Creator Weekend nous a permis de produire trois mois de contenu en deux jours. Un partenaire serieux et tres organise.",
  },
  {
    initials: "MD",
    name: "Marie Diop",
    organization: "Chef de projet, ONG Teranga",
    quote:
      "Streaming bilingue francais-wolof sans accroc pour notre gala. Notre audience internationale a vraiment apprecie la qualite.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-white py-24">
      {/* Temoignages geres depuis Parametres au Prompt 11 */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Ce que disent nos clients
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Des partenaires qui nous renouvellent leur confiance.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-xl bg-zinc-50 p-6 shadow-sm"
            >
              <div className="flex items-center gap-1 text-[#F5B800]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700">
                &laquo; {t.quote} &raquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8151B] text-sm font-semibold text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.organization}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCtaSection() {
  return (
    <section className="bg-[#C8151B] py-24 text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Pret a diffuser votre prochain evenement ?
        </h2>
        <p className="mt-4 text-base text-white/80 md:text-lg">
          Parlons de votre projet. Reponse sous 24h.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-[#C8151B] shadow-sm transition-colors hover:bg-zinc-100"
        >
          Demander un devis
        </Link>
      </motion.div>
    </section>
  )
}
