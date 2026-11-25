import type { Metadata } from "next"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatOfferPrice } from "@/lib/offers"
import { getActiveOffers, getSiteContents, type OfferView } from "@/lib/home-data"
import {
  SERVICE_KEYS,
  SERVICE_META,
  type ServiceContent,
  type ServiceKey,
} from "@/lib/site-content"
import { JsonLd } from "@/components/public/json-ld"
import {
  CineButton,
  CineHeading,
  Kicker,
  PAD,
} from "@/components/public/cine/primitives"
import { FinalCtaSection } from "@/components/public/home/final-cta-section"
import { ChapterNav, type ChapterLink } from "@/components/public/services/chapter-nav"
import { ChapterScroll } from "@/components/public/services/chapter-scroll"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Captation et streaming live, CEO Content, Creator Weekend et publication réseaux : quatre offres, une même exigence technique.",
  path: "/services",
})

export const revalidate = 60

const pad = (n: number) => String(n).padStart(2, "0")

// Chapitres sombres et clairs en alternance (maquette)
const LIGHT: Record<ServiceKey, boolean> = {
  live: false,
  ceo: true,
  creator: false,
  social: true,
}

export default async function ServicesPage() {
  const [contents, offers] = await Promise.all([
    getSiteContents(["services_content", "services_page"]),
    getActiveOffers(),
  ])
  const page = contents.services_page
  const services = contents.services_content

  const chapters = services
    ? SERVICE_KEYS.map((key, i) => ({ key, service: services[key], number: pad(i + 1) }))
    : []
  const links: ChapterLink[] = chapters.map(({ key, service, number }) => ({
    anchor: SERVICE_META[key].anchor,
    number,
    label: `${service.title} ${service.titleAccent}`.trim(),
  }))
  const anchors = Object.fromEntries(SERVICE_KEYS.map((k) => [k, SERVICE_META[k].anchor]))

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Captation et streaming live",
          provider: { "@type": "Organization", name: "Jolof Stream" },
          areaServed: "SN",
          description:
            "Captation multi-caméras HD et diffusion en direct sur toutes les plateformes.",
        }}
      />
      <ChapterScroll anchors={anchors} />

      {page && (
        <section className={`bg-black pb-[110px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            {page.kicker && <Kicker>{page.kicker}</Kicker>}
            <CineHeading
              as="h1"
              title={page.title}
              accent={page.titleAccent}
              className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]"
            />
            {page.lead && (
              <p className="mt-[22px] max-w-[560px] text-[18px] leading-[1.7] text-cine-cream/70">
                {page.lead}
              </p>
            )}
            {links.length > 0 && (
              <nav aria-label="Aller au chapitre" className="mt-10 flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={link.anchor}
                    href={`#${link.anchor}`}
                    className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-cine-cream/[0.07] px-[18px] text-[14px] font-semibold text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.14)] transition-colors hover:bg-cine-cream hover:text-cine-bg"
                  >
                    <small className="font-mono text-[11px] font-semibold text-cine-yellow group-hover:text-cine-red">
                      {link.number}
                    </small>
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>
      )}

      {chapters.length > 0 && (
        <div className="relative">
          <aside className="pointer-events-none absolute inset-y-0 left-[clamp(18px,3vw,48px)] z-10 hidden w-[200px] pt-[130px] min-[1360px]:block">
            <ChapterNav chapters={links} />
          </aside>
          {chapters.map(({ key, service, number }) => (
            <Chapter
              key={key}
              serviceKey={key}
              service={service}
              number={number}
              light={LIGHT[key]}
              offers={offers.filter((o) => o.serviceType === SERVICE_META[key].offerType)}
            />
          ))}
        </div>
      )}

      {page && (
        <FinalCtaSection
          marquee={page.finalMarquee}
          text={page.finalText}
          ctaLabel="Demander un devis"
          ctaHref="/contact"
        />
      )}
    </>
  )
}

function Chapter({
  serviceKey,
  service,
  number,
  light,
  offers,
}: {
  serviceKey: ServiceKey
  service: ServiceContent
  number: string
  light: boolean
  offers: OfferView[]
}) {
  const meta = SERVICE_META[serviceKey]
  const contactHref = `/contact?besoin=${meta.contactValue}`
  const sub = cn(
    "mb-[18px] font-mono text-[12px] font-semibold uppercase tracking-[0.16em]",
    light ? "text-[#6B5753]" : "text-cine-cream/65"
  )
  const tile = light
    ? "bg-white shadow-[inset_0_0_0_1px_rgba(26,17,16,0.07)]"
    : "bg-cine-cream/[0.04]"

  return (
    <section
      id={meta.anchor}
      aria-labelledby={`${meta.anchor}-titre`}
      className={cn(
        "scroll-mt-[84px]",
        light ? "bg-cine-cream text-cine-ink" : "bg-cine-bg text-cine-cream"
      )}
    >
      <div
        className={`mx-auto flex max-w-[1440px] flex-wrap gap-14 py-[96px] min-[761px]:py-[130px] min-[1360px]:pl-[260px] ${PAD}`}
      >
        <div className="min-w-0 flex-[1_1_340px] self-start lg:sticky lg:top-[120px]">
          <p
            aria-hidden="true"
            className={cn(
              "font-display text-[clamp(110px,12vw,190px)] leading-[0.8] text-transparent",
              light
                ? "[-webkit-text-stroke:1px_rgba(26,17,16,0.25)]"
                : "[-webkit-text-stroke:1px_rgba(244,240,234,0.32)]"
            )}
          >
            {number}
          </p>
          {service.kicker && (
            <Kicker tone={light ? "light" : "dark"} className="mt-6">
              {service.kicker}
            </Kicker>
          )}
          <h2
            id={`${meta.anchor}-titre`}
            className="mb-[18px] mt-4 font-display text-[clamp(44px,5vw,80px)] font-normal leading-[0.95] tracking-[-0.025em]"
          >
            {service.title}{" "}
            {service.titleAccent && (
              <em className={cn("italic", light ? "text-cine-red" : "text-cine-yellow")}>
                {service.titleAccent}
              </em>
            )}
          </h2>
          <p
            className={cn(
              "mb-7 text-[17px] leading-[1.7]",
              light ? "text-[#5B4A46]" : "text-cine-cream/70"
            )}
          >
            {service.intro}
          </p>
          <CineButton href={contactHref} arrow>
            Demander un devis
          </CineButton>
        </div>

        <div className="min-w-0 flex-[1.6_1_540px]">
          {service.included.length > 0 && (
            <>
              <h3 className={sub}>Ce qui est inclus</h3>
              <ul className="mb-[52px] grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-2.5">
                {service.included.map((item) => (
                  <li
                    key={item}
                    className={cn("flex items-center gap-3 rounded-lg px-4 py-[15px] text-[15px]", tile)}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn("h-[18px] w-[18px] shrink-0", light ? "text-cine-red" : "text-cine-yellow")}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {service.steps.length > 0 && (
            <>
              <h3 className={sub}>Comment ça se passe</h3>
              <ol className="mb-[52px] grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">
                {service.steps.map((step, i) => (
                  <li key={`${step.title}-${i}`} className={cn("rounded-lg px-[18px] pb-[22px] pt-5", tile)}>
                    <small
                      className={cn(
                        "mb-2.5 block font-mono text-[11px] font-semibold tracking-[0.12em]",
                        light ? "text-cine-red" : "text-cine-yellow"
                      )}
                    >
                      ÉTAPE {pad(i + 1)}
                    </small>
                    <strong className="mb-1.5 block text-[16px]">{step.title}</strong>
                    <span className={cn("text-[13px] leading-[1.55]", light ? "text-[#6B5753]" : "text-cine-cream/70")}>
                      {step.description}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <h3 className={sub}>Nos formules</h3>
          {offers.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-3.5">
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  className={cn(
                    "relative rounded-[10px] p-7",
                    offer.isPopular
                      ? "bg-cine-red text-white"
                      : light
                        ? "bg-white shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]"
                        : "bg-cine-bg3 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]"
                  )}
                >
                  {offer.isPopular && (
                    <p className="mb-3 inline-block rounded-md bg-black/20 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                      Le plus choisi
                    </p>
                  )}
                  <h4 className="mb-4 font-display text-[38px] font-normal leading-none tracking-[-0.02em]">
                    {offer.name}
                  </h4>
                  {offer.features.length > 0 && (
                    <ul className="mb-[22px] flex flex-col gap-2 text-[14px]">
                      {offer.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span aria-hidden="true" className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-60" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p
                    className={cn(
                      "inline-block rounded-md px-2.5 py-1.5 font-mono text-[12px] font-semibold tracking-[0.04em]",
                      offer.isPopular
                        ? "bg-black/20 text-white"
                        : light
                          ? "bg-cine-red/[0.08] text-cine-red"
                          : "bg-cine-yellow/[0.14] text-cine-yellow"
                    )}
                  >
                    {formatOfferPrice(offer.price, offer.priceLabel)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className={cn("flex flex-wrap items-center justify-between gap-5 rounded-[10px] p-7", tile)}>
              <p className="font-display text-[34px] leading-none">Sur devis</p>
              <CineButton href={contactHref} variant={light ? "outLight" : "outDark"}>
                Demander un devis
              </CineButton>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
