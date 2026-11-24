import Image from "next/image"

import { initialsOf, type TestimonialView } from "@/lib/testimonials"
import type { HomeSections } from "@/lib/site-content"
import { CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"

// Temoignages publies (contexte GENERAL), sans note ; masques si aucun
export function TestimonialsSection({
  sections,
  testimonials,
}: {
  sections: HomeSections
  testimonials: TestimonialView[]
}) {
  if (testimonials.length === 0) return null
  return (
    <section className={`bg-cine-bg pb-[110px] pt-10 text-cine-cream min-[761px]:pb-[150px] ${PAD}`}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16">
          {sections.testimonialsKicker && <Kicker>{sections.testimonialsKicker}</Kicker>}
          <CineHeading
            title={sections.testimonialsTitle}
            accent={sections.testimonialsTitleAccent}
            breakLine={false}
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="m-0 flex min-h-[280px] flex-col justify-between gap-[30px] rounded-xl bg-cine-bg3 p-[34px] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]"
            >
              <blockquote className="m-0 font-display text-[28px] leading-[1.2] text-cine-cream/80">
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-4">
                {t.photoUrl ? (
                  <Image
                    src={t.photoUrl}
                    alt=""
                    width={52}
                    height={52}
                    className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-cine-cream2 font-mono text-[13px] font-semibold tracking-[0.06em] text-cine-ink"
                  >
                    {initialsOf(t.authorName)}
                  </span>
                )}
                <span>
                  <strong className="block text-[15px] text-cine-cream">{t.authorName}</strong>
                  {t.authorRole && <span className="text-[13px] text-cine-cream/65">{t.authorRole}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
