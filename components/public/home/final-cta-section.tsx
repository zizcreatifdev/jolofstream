import { Emphasis, CineButton, PAD } from "@/components/public/cine/primitives"

// Appel final : bandeau geant defilant, texte, bouton et telephone
export function FinalCtaSection({
  marquee,
  text,
  ctaLabel,
  ctaHref,
  phone,
  phoneHref,
}: {
  marquee: string
  text: string
  ctaLabel: string
  ctaHref: string
  phone?: string
  phoneHref?: string
}) {
  const plain = marquee.replace(/\*+/g, "")
  const copy = (
    <span className="whitespace-nowrap pr-[60px] font-display text-[clamp(90px,13vw,220px)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(244,240,234,0.35)]">
      <Emphasis
        text={marquee}
        emClassName="italic text-cine-red [-webkit-text-stroke:0]"
        strongClassName="text-cine-red [-webkit-text-stroke:0]"
      />{" "}
      ·
    </span>
  )
  return (
    <section className="relative overflow-hidden bg-cine-bg pb-[140px] pt-[130px] text-cine-cream">
      <h2 className="sr-only">{plain}</h2>
      <div aria-hidden="true" className="cine-marquee mb-[70px] flex w-max">
        {copy}
        {copy}
      </div>
      <div className={`mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 ${PAD}`}>
        <p className="m-0 max-w-[520px] text-[18px] leading-[1.7] text-cine-cream/70">{text}</p>
        <div className="flex flex-wrap gap-3">
          <CineButton href={ctaHref} arrow>
            {ctaLabel}
          </CineButton>
          {phone && phoneHref && (
            <CineButton href={`tel:${phoneHref}`} variant="outDark">
              {phone}
            </CineButton>
          )}
        </div>
      </div>
    </section>
  )
}
