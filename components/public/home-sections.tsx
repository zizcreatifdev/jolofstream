"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import {
  ArrowRight,
  Camera,
  Clock,
  Layers,
  MapPin,
  User,
  Users,
  Video,
} from "lucide-react"

const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
}

// SECTION 1 — HERO

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-ink pb-20 pt-32 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(200,21,27,0.25),transparent_60%),radial-gradient(ellipse_40%_40%_at_10%_80%,rgba(245,184,0,0.08),transparent_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={heroItem}
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/65"
          >
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
            Disponible pour vos evenements 2026
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="mb-8 max-w-[5em] font-display font-normal leading-[0.95] tracking-tighter text-white"
            style={{ fontSize: "clamp(52px, 7.5vw, 112px)" }}
          >
            Capturez{" "}
            <span className="italic text-[#F5B800]">l&apos;instant</span>,
            diffusez{" "}
            <span className="italic text-[#F5B800]">l&apos;emotion</span>.
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mb-12 max-w-[520px] text-[17px] font-light leading-[1.8] text-white/50"
          >
            Jolof Stream transforme vos evenements en experiences digitales
            accessibles partout. Production HD multi-cameras, diffusion en
            direct, montage clef en main.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[10px] bg-[#C8151B] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-[#8F0E12] hover:shadow-[0_8px_24px_rgba(200,21,27,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8151B] focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Demander un devis
            </Link>
            <Link
              href="/formations"
              className="inline-flex items-center justify-center rounded-[10px] border border-white/30 bg-transparent px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:border-white/60 hover:bg-white/[0.08]"
            >
              Voir les formations
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" as const }}
          className="mt-20 grid grid-cols-1 gap-10 border-t border-white/[0.06] pt-12 sm:grid-cols-3 sm:gap-12"
        >
          <HeroStat value="+200" suffix="" label="evenements couverts depuis 2020" />
          <HeroStat value="3" suffix="" label="plateformes en simultane" />
          <HeroStat value="HD" suffix="" label="qualite garantie" highlighted={false} />
        </motion.div>
      </div>
    </section>
  )
}

function HeroStat({
  value,
  suffix,
  label,
  highlighted = true,
}: {
  value: string
  suffix?: string
  label: string
  highlighted?: boolean
}) {
  return (
    <div>
      <p className="font-display tracking-tight leading-none">
        <span
          className={
            highlighted && /^\+?\d/.test(value) ? "text-[#F5B800]" : "text-white"
          }
          style={{ fontSize: "42px" }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-white" style={{ fontSize: "42px" }}>
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-2 text-[13px] font-normal leading-relaxed text-white/35">
        {label}
      </p>
    </div>
  )
}

// SECTION 2 — BANDE SERVICES (fond rouge)

const bandItems = [
  {
    icon: Video,
    label: "Captation multi-cameras",
    sub: "HD jusqu'a 4K",
  },
  {
    icon: User,
    label: "CEO Content",
    sub: "Mensuel ou ponctuel",
  },
  {
    icon: Camera,
    label: "Creator Weekend",
    sub: "48h intensives",
  },
  {
    icon: Layers,
    label: "Habillage graphique",
    sub: "Identite visuelle",
  },
]

export function ServiceBandSection() {
  return (
    <section className="overflow-hidden bg-[#C8151B]">
      <div className="mx-auto max-w-7xl">
        <ul className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-4 md:overflow-visible">
          {bandItems.map((item, index) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className={`flex shrink-0 snap-center cursor-pointer items-center gap-4 px-8 py-7 transition-all duration-150 hover:bg-white/[0.08] ${
                  index < bandItems.length - 1 ? "md:border-r md:border-white/15" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.12]">
                  <Icon className="h-5 w-5 stroke-white" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-snug text-white">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-white/55">{item.sub}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// SECTION 3 — QUI SOMMES-NOUS

export function AboutStatsSection() {
  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-card bg-ink-2">
              <div className="h-full w-full bg-gradient-to-br from-[#8F0E12] to-[#161110]" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="absolute -bottom-6 -right-6 rounded-card bg-white p-5 shadow-[0_20px_60px_rgba(22,17,16,0.15)]"
            >
              <p className="font-display text-[36px] leading-none tracking-tight text-[#C8151B]">
                +200
              </p>
              <p className="mt-1 text-xs text-ink-3">evenements diffuses</p>
            </motion.div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
                Qui sommes-nous
              </span>
            </div>
            <h2
              className="mb-6 font-display font-normal leading-[1.1] tracking-tight text-ink"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              L&apos;agence senegalaise qui sait{" "}
              <span className="italic">capter votre evenement</span>.
            </h2>
            <p className="mb-8 text-[15px] font-light leading-[1.8] text-ink-2">
              Basee a Dakar, Jolof Stream associe expertise technique et
              sensibilite multiculturelle pour offrir des productions de
              niveau international. De la conference au gala, du contenu
              corporate au coaching createurs, nous transformons chaque
              moment en experience digitale memorable.
            </p>
            <ul className="mb-10 space-y-3">
              {[
                "Materiel professionnel et qualite HD garantie",
                "Equipe experimentee avec backup systematique",
                "Diffusion multi-plateformes simultanees",
                "Livraison rapide des enregistrements",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8151B]"
                  />
                  <span className="text-[15px] font-light text-ink-2">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/a-propos"
                className="inline-flex items-center justify-center rounded-[10px] bg-[#C8151B] px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-[#8F0E12] hover:shadow-[0_8px_24px_rgba(200,21,27,0.3)]"
              >
                Notre histoire
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-[10px] border border-ink/15 bg-transparent px-6 py-3 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink hover:bg-cream-2"
              >
                Nos realisations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// SECTION 4 — SERVICES PHARES

type ServiceCard = {
  category: string
  title: string
  description: string
  icon: typeof Video
  featured?: boolean
}

const featuredServices: ServiceCard[] = [
  {
    category: "Streaming Live",
    title: "Captation evenementielle",
    description:
      "Production HD multi-cameras avec diffusion en direct sur toutes les plateformes. Regie complete, equipe le jour J, livrables sous 5 jours.",
    icon: Video,
  },
  {
    category: "Recurrence mensuelle",
    title: "CEO Content Package",
    description:
      "Contenus video professionnels mensuels pour asseoir votre image de dirigeant. Format clef en main, du tournage a la publication.",
    icon: User,
    featured: true,
  },
  {
    category: "Intensif 48h",
    title: "Creator Weekend",
    description:
      "Un week-end de tournage intensif pour produire tous vos contenus en une session. Studio mobile, eclairage cinema, montage inclus.",
    icon: Camera,
  },
]

export function FeaturedServicesSection() {
  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
                Nos services
              </span>
            </div>
            <h2
              className="font-display font-normal leading-[1.1] tracking-tight text-ink"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              Des prestations <span className="italic">sur mesure</span>.
            </h2>
          </div>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#C8151B] transition-all duration-150 hover:gap-3"
          >
            Voir tous les services
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {featuredServices.map((service) => {
            const Icon = service.icon
            const isDark = service.featured
            return (
              <article
                key={service.title}
                className={`group relative overflow-hidden rounded-card border p-9 transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(22,17,16,0.1)] ${
                  isDark
                    ? "border-ink bg-ink"
                    : "border-[var(--jolof-border)] bg-white hover:border-cream-3"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-250 group-hover:scale-x-100 ${
                    isDark ? "bg-[#F5B800]" : "bg-[#C8151B]"
                  }`}
                />
                <span
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${
                    isDark ? "bg-[#F5B800]/15" : "bg-red-soft"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${isDark ? "stroke-[#F5B800]" : "stroke-[#C8151B]"}`}
                    strokeWidth={1.5}
                  />
                </span>
                <span
                  className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                    isDark
                      ? "bg-[#F5B800]/20 text-[#F5B800]"
                      : "bg-red-soft text-[#C8151B]"
                  }`}
                >
                  {service.category}
                </span>
                <h3
                  className={`mb-2.5 text-lg font-semibold tracking-snug ${
                    isDark ? "text-white" : "text-ink"
                  }`}
                >
                  {service.title}
                </h3>
                <p
                  className={`mb-6 text-sm font-light leading-[1.75] ${
                    isDark ? "text-white/45" : "text-ink-3"
                  }`}
                >
                  {service.description}
                </p>
                <Link
                  href="/services"
                  className={`group/link inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-150 hover:gap-2.5 ${
                    isDark ? "text-[#F5B800]" : "text-[#C8151B]"
                  }`}
                >
                  En savoir plus
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// SECTION 5 — PORTFOLIO PREVIEW

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
    description: "12 capsules video mensuelles.",
  },
  {
    type: "Creator Weekend",
    title: "Lancement marque mode",
    description: "Weekend de tournage, 25 livrables.",
  },
  {
    type: "Streaming Live",
    title: "Gala associatif",
    description: "Streaming bilingue, replay archive.",
  },
  {
    type: "CEO Content",
    title: "Podcast entreprise",
    description: "Studio mobile, 10 episodes.",
  },
]

const portfolioTypeLabel: Record<string, string> = {
  streaming_live: "Streaming Live",
  ceo_content: "CEO Content",
  creator_weekend: "Creator Weekend",
  formations: "Formations",
}

const gradients = [
  "bg-gradient-to-br from-[#1a0a0a] to-[#3d1010]",
  "bg-gradient-to-br from-[#0a0f1a] to-[#101e3d]",
  "bg-gradient-to-br from-[#0a1a0e] to-[#103d18]",
  "bg-gradient-to-br from-[#1a100a] to-[#3d2210]",
  "bg-gradient-to-br from-[#150a1a] to-[#2e1040]",
]

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
    <section className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
                Portfolio
              </span>
            </div>
            <h2
              className="font-display font-normal leading-[1.1] tracking-tight text-ink"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              Nos <span className="italic">realisations</span>.
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#C8151B] transition-all duration-150 hover:gap-3"
          >
            Voir tout le portfolio
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 grid-rows-[200px_200px] gap-3 sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[240px_240px]">
          {items.slice(0, 5).map((item, index) => (
            <article
              key={item.id ?? item.title}
              className={`group relative cursor-pointer overflow-hidden rounded-card ${
                index === 0 ? "row-span-2" : ""
              } ${gradients[index % gradients.length]}`}
            >
              {item.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-250 group-hover:opacity-100"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              )}
              {!item.thumbnailUrl && (
                <div
                  aria-hidden
                  className="flex h-full w-full items-center justify-center"
                >
                  <Camera className="h-10 w-10 stroke-white/20" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,10,9,0.8)] via-transparent to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 transition-all duration-250 group-hover:opacity-100">
                <p className="mb-1 text-[11px] font-medium text-[#F5B800]">
                  {item.type}
                </p>
                <p className="text-[15px] font-semibold leading-snug text-white">
                  {item.title}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// SECTION 6 — FORMATIONS PREVIEW

const trainingPreview = [
  {
    title: "Streaming Live : de la captation a la diffusion",
    description:
      "Apprenez a maitriser la captation multi-cameras, la regie et les bonnes pratiques de diffusion en direct.",
    day: "14",
    month: "Juin",
    location: "Dakar",
    duration: "2 jours",
    seatsTaken: 12,
    seatsTotal: 20,
  },
  {
    title: "Creator Weekend : production de contenus en 48h",
    description:
      "Setup studio, eclairage cinema, montage, distribution : le programme complet pour creators independants.",
    day: "05",
    month: "Juil",
    location: "Dakar",
    duration: "2 jours",
    seatsTaken: 8,
    seatsTotal: 15,
  },
]

export function FormationsPreviewSection() {
  return (
    <section className="bg-cream-2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
                Formations
              </span>
            </div>
            <h2
              className="font-display font-normal leading-[1.1] tracking-tight text-ink"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              Prochaines <span className="italic">sessions</span>.
            </h2>
          </div>
          <Link
            href="/formations"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#C8151B] transition-all duration-150 hover:gap-3"
          >
            Voir toutes les formations
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {trainingPreview.map((session) => {
            const percent = Math.round(
              (session.seatsTaken / session.seatsTotal) * 100
            )
            const remaining = session.seatsTotal - session.seatsTaken
            const isAlmostFull = remaining / session.seatsTotal <= 0.2
            return (
              <article
                key={session.title}
                className="flex flex-col gap-6 rounded-card border border-[var(--jolof-border)] bg-white p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(22,17,16,0.08)] sm:flex-row sm:items-start"
              >
                <div className="flex min-w-[60px] flex-shrink-0 flex-col items-center rounded-[10px] bg-[#C8151B] px-3.5 py-2.5 text-white">
                  <span className="font-display text-[28px] leading-none tracking-tight">
                    {session.day}
                  </span>
                  <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">
                    {session.month}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        isAlmostFull
                          ? "bg-[#F5B800]/20 text-[#8a6500]"
                          : "bg-red-soft text-[#C8151B]"
                      }`}
                    >
                      {isAlmostFull ? "Bientot complet" : `${remaining} places`}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold tracking-snug text-ink">
                    {session.title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-ink-3">
                    {session.description}
                  </p>
                  <ul className="mt-3 flex flex-wrap items-center gap-4">
                    <li className="flex items-center gap-1.5 text-xs text-ink-4">
                      <MapPin className="h-3.5 w-3.5 stroke-ink-4" strokeWidth={1.5} />
                      {session.location}
                    </li>
                    <li className="flex items-center gap-1.5 text-xs text-ink-4">
                      <Clock className="h-3.5 w-3.5 stroke-ink-4" strokeWidth={1.5} />
                      {session.duration}
                    </li>
                    <li className="flex items-center gap-1.5 text-xs text-ink-4">
                      <Users className="h-3.5 w-3.5 stroke-ink-4" strokeWidth={1.5} />
                      {session.seatsTaken}/{session.seatsTotal} inscrits
                    </li>
                  </ul>
                  <div className="mt-4">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-cream-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAlmostFull ? "bg-[#E85D04]" : "bg-[#C8151B]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// SECTION 7 — TEMOIGNAGES

type Testimonial = {
  initials: string
  name: string
  organization: string
  quote: string
  rating: number
}

function initialsFromName(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "JS"
  )
}

const fallbackTestimonials: Testimonial[] = [
  {
    initials: "AT",
    name: "Aminata Toure",
    organization: "Directrice marketing, Fintech Dakar",
    quote:
      "Jolof Stream a transforme notre conference annuelle en un evenement vu par toute la diaspora. Production impeccable et equipe a l'ecoute.",
    rating: 5,
  },
  {
    initials: "OS",
    name: "Ousmane Sow",
    organization: "Fondateur, Studio Baobab",
    quote:
      "Le Creator Weekend nous a permis de produire trois mois de contenu en deux jours. Un partenaire serieux et tres organise.",
    rating: 5,
  },
  {
    initials: "MD",
    name: "Marie Diop",
    organization: "Chef de projet, ONG Teranga",
    quote:
      "Streaming bilingue francais-wolof sans accroc pour notre gala. Notre audience internationale a vraiment apprecie la qualite.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    fallbackTestimonials
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch("/api/parametres?keys=testimonials", {
          cache: "no-store",
        })
        if (!r.ok) return
        const data = (await r.json()) as Record<string, string>
        if (!data.testimonials) return
        const parsed = JSON.parse(data.testimonials) as Array<{
          name: string
          organization: string
          text: string
          rating: number
        }>
        if (cancelled || !Array.isArray(parsed) || parsed.length === 0) return
        setTestimonials(
          parsed.map((t) => ({
            initials: initialsFromName(t.name),
            name: t.name,
            organization: t.organization,
            quote: t.text,
            rating: t.rating || 5,
          }))
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
    <section className="bg-ink py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
              Temoignages
            </span>
          </div>
          <h2
            className="font-display font-normal leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
          >
            Ils nous font <span className="italic text-[#F5B800]">confiance</span>.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <figure
              key={`${t.name}-${idx}`}
              className="flex h-full flex-col rounded-card border border-white/[0.07] bg-white/[0.04] p-8"
            >
              <div className="mb-4 flex items-center gap-0.5 text-[#F5B800]">
                {Array.from({ length: Math.min(5, Math.max(1, t.rating)) }).map(
                  (_, i) => (
                    <span key={i} className="text-sm">
                      ★
                    </span>
                  )
                )}
              </div>
              <blockquote className="mb-6 flex-1 text-[15px] font-light italic leading-[1.75] text-white/70">
                &laquo; {t.quote} &raquo;
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8151B] font-display text-base text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs font-normal text-white/35">
                    {t.organization}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// SECTION 8 — CTA FINAL

export function FinalCtaSection() {
  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-card bg-[#C8151B] px-8 py-16 text-white sm:px-12 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-20 lg:py-[72px]">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-white/[0.06]"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 right-10 h-[200px] w-[200px] rounded-full bg-black/[0.08]"
          />

          <div className="relative">
            <h2
              className="mb-3 font-display font-normal leading-[1.1] tracking-tight text-white"
              style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Pret a diffuser votre <span className="italic">prochain</span> evenement ?
            </h2>
            <p className="text-base font-light leading-[1.7] text-white/70">
              Parlons de votre projet. Reponse sous 24h ouvrees, devis
              detaille et transparent.
            </p>
          </div>

          <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[10px] bg-white px-7 py-3.5 text-[15px] font-semibold text-[#C8151B] transition-all duration-150 hover:-translate-y-px hover:bg-cream"
            >
              Demander un devis
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-[10px] border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:border-white/60 hover:bg-white/[0.08]"
            >
              Voir nos services
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
