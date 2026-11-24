import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatOfferPrice } from "@/lib/offers"
import { lowestPrice, type OfferView, type SessionPreview } from "@/lib/home-data"
import {
  SERVICE_META,
  type HomeSections,
  type ServiceContent,
  type ServicesContent,
} from "@/lib/site-content"
import { CineButton, CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"
import { FormationsOfferCard } from "@/components/public/home/formations-offer-card"

// Offres : trois cartes empilees (collantes sur bureau)
export function OffersSection({
  sections,
  services,
  offers,
  sessions,
}: {
  sections: HomeSections
  services: ServicesContent | null
  offers: OfferView[]
  sessions: SessionPreview[]
}) {
  const cards: Array<{ key: "ceo" | "creator"; service: ServiceContent }> = []
  if (services?.ceo) cards.push({ key: "ceo", service: services.ceo })
  if (services?.creator) cards.push({ key: "creator", service: services.creator })

  return (
    <section className={`bg-cine-bg pb-[140px] text-cine-cream ${PAD}`}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 pt-10">
          {sections.offersKicker && <Kicker>{sections.offersKicker}</Kicker>}
          <CineHeading title={sections.offersTitle} accent={sections.offersTitleAccent} />
        </div>

        <div className="space-y-7">
          {cards.map(({ key, service }, i) => {
            const cheapest = lowestPrice(offers, SERVICE_META[key].offerType)
            const isCeo = key === "ceo"
            return (
              <article
                key={key}
                className={cn(
                  "flex min-h-[560px] flex-wrap items-start gap-12 rounded-[10px] p-[clamp(28px,4vw,64px)]",
                  isCeo
                    ? "bg-cine-bg2 text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)] lg:sticky lg:top-[110px]"
                    : "bg-cine-red text-white lg:sticky lg:top-[138px]"
                )}
              >
                <div className="min-w-0 flex-[1_1_380px]">
                  <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-cine-yellow">
                    {String(i + 1).padStart(2, "0")} · {service.kicker}
                  </p>
                  <h3 className="mb-[22px] mt-4 font-display text-[clamp(52px,6.6vw,104px)] font-normal leading-[0.92] tracking-[-0.025em]">
                    {service.title} {service.titleAccent}
                  </h3>
                  <p
                    className={cn(
                      "mb-[30px] max-w-[520px] text-[17px] leading-[1.7]",
                      isCeo ? "text-cine-cream/70" : "text-white/90"
                    )}
                  >
                    {service.intro}
                  </p>
                  <CineButton href={`/services?s=${key}`} variant={isCeo ? "red" : "ink"} arrow>
                    Découvrir l’offre
                  </CineButton>
                </div>
                <div className="min-w-0 flex-[1_1_380px]">
                  <ul>
                    {service.included.slice(0, 4).map((item) => (
                      <li
                        key={item}
                        className={cn(
                          "flex items-center gap-3.5 border-b py-4 text-[16px]",
                          isCeo ? "border-cine-cream/[0.15]" : "border-white/[0.22]"
                        )}
                      >
                        <Check className="h-[18px] w-[18px] shrink-0 text-cine-yellow" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p
                    className={cn(
                      "mt-7 rounded-lg px-[22px] py-5",
                      isCeo ? "bg-cine-cream/[0.05]" : "bg-black/[0.18]"
                    )}
                  >
                    {cheapest ? (
                      <>
                        <span className="block text-[14px] opacity-80">À partir de</span>
                        <strong className="text-[17px]">
                          {formatOfferPrice(cheapest.price, cheapest.priceLabel)}
                        </strong>
                      </>
                    ) : (
                      <strong className="text-[17px]">Sur devis</strong>
                    )}
                  </p>
                </div>
              </article>
            )
          })}

          <FormationsOfferCard
            number={String(cards.length + 1).padStart(2, "0")}
            title={sections.formationsTitle}
            text={sections.formationsText}
            sessions={sessions}
          />
        </div>
      </div>
    </section>
  )
}
