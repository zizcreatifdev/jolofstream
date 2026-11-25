import { Plus } from "lucide-react"

import type { FaqItems } from "@/lib/site-content"
import { CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"

// Questions frequentes (faq_items) : details natifs, accessibles au clavier
export function FaqSection({ items }: { items: FaqItems }) {
  if (items.length === 0) return null
  return (
    <section aria-label="Questions fréquentes" className={`bg-cine-cream py-[96px] text-cine-ink min-[761px]:py-[130px] ${PAD}`}>
      <div className="mx-auto flex max-w-[1440px] flex-wrap gap-14">
        <div className="min-w-0 flex-[1_1_300px]">
          <Kicker tone="light">Questions fréquentes</Kicker>
          <CineHeading
            as="h2"
            title="Tout ce qu’on"
            accent="nous demande."
            tone="light"
            breakLine={false}
            className="mt-[18px] text-[clamp(44px,5vw,80px)]"
          />
        </div>
        <div className="min-w-0 flex-[2_1_520px] border-t border-cine-ink/[0.12]">
          {items.map((item, i) => (
            <details key={i} className="group border-b border-cine-ink/[0.12]" open={i === 0}>
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-5 py-[26px] text-[clamp(17px,2vw,20px)] font-semibold tracking-[-0.01em] hover:text-cine-red [&::-webkit-details-marker]:hidden">
                {item.question}
                <b
                  aria-hidden="true"
                  className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(26,17,16,0.15)] transition-[transform,background-color] duration-300 group-open:rotate-45 group-open:bg-cine-red group-open:text-white group-open:shadow-none motion-reduce:transition-none"
                >
                  <Plus className="h-4 w-4" />
                </b>
              </summary>
              <p className="m-0 pb-[26px] text-[16px] leading-[1.75] text-[#5B4A46] min-[761px]:pr-[60px]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
