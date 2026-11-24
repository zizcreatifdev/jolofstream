"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { HomeSkills } from "@/lib/site-content"
import { CineButton, Kicker } from "@/components/public/cine/primitives"

const pad = (n: number) => String(n).padStart(2, "0")

// Savoir-faire : sur bureau, liste numerotee et panneau d'apercu mis a jour au
// survol comme au focus clavier ; sur mobile, accordeon (pas de survol)
export function SkillsSection({ content }: { content: HomeSkills }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const items = content.items
  const current = items[Math.min(active, items.length - 1)]

  return (
    <section className="bg-cine-bg px-[clamp(18px,4.5vw,72px)] py-[96px] text-cine-cream min-[761px]:py-[150px]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-12">
        <div className="min-w-0 flex-[1.3_1_560px]">
          {content.kicker && <Kicker>{content.kicker}</Kicker>}
          <h2 className="mb-12 mt-[18px] font-display text-[clamp(44px,6vw,96px)] font-normal leading-[0.94] tracking-[-0.025em]">
            {content.title}
            {content.titleAccent && (
              <>
                <br />
                <em className="italic text-cine-yellow">{content.titleAccent}</em>
              </>
            )}
          </h2>

          <ul className="border-b border-cine-cream/[0.12]">
            {items.map((item, i) => {
              const isActive = i === active
              const isOpen = open === i
              const panelId = `skill-panel-${i}`
              return (
                <li key={`${item.title}-${i}`} className="border-t border-cine-cream/[0.12]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => {
                      setActive(i)
                      setOpen(isOpen ? null : i)
                    }}
                    className={cn(
                      "group flex min-h-[44px] w-full items-baseline gap-[22px] py-6 text-left transition-[color,padding] duration-300",
                      isActive
                        ? "text-cine-cream lg:pl-3.5"
                        : "text-cine-cream/60 hover:text-cine-cream lg:text-cine-cream/40"
                    )}
                  >
                    <small
                      className={cn(
                        "w-[34px] shrink-0 font-mono text-[13px] font-semibold",
                        isActive && "lg:text-cine-red"
                      )}
                    >
                      {pad(i + 1)}
                    </small>
                    <strong className="font-display text-[clamp(30px,3.4vw,52px)] font-normal leading-[1.05] tracking-[-0.02em]">
                      {item.title}
                    </strong>
                    <ArrowRight
                      aria-hidden="true"
                      className={cn(
                        "ml-auto hidden h-[26px] w-[26px] shrink-0 self-center text-cine-yellow transition-[opacity,transform] duration-300 lg:block",
                        isActive ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                      )}
                    />
                    <Plus
                      aria-hidden="true"
                      className={cn(
                        "ml-auto h-6 w-6 shrink-0 self-center text-cine-yellow transition-transform lg:hidden",
                        isOpen && "rotate-45"
                      )}
                    />
                  </button>
                  <div id={panelId} hidden={!isOpen} className="pb-6 pl-14 lg:hidden">
                    <p className="text-[16px] leading-[1.65] text-cine-cream/85">{item.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <CineButton href="/services" variant="outDark" arrow className="mt-9">
            Voir le détail des services
          </CineButton>
        </div>

        {current && (
          <div className="sticky top-[110px] hidden min-w-0 flex-[1_1_380px] lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-cine-ink">
              {current.imageUrl && (
                <>
                  <Image
                    key={current.imageUrl}
                    src={current.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-[rgba(5,3,3,0.55)]" />
                </>
              )}
              <span
                aria-hidden="true"
                className="absolute right-6 top-[18px] font-display text-[140px] leading-none text-cine-cream/[0.12]"
              >
                {pad(active + 1)}
              </span>
              <div className="absolute inset-x-7 bottom-7">
                <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-cine-yellow">
                  {current.title}
                </p>
                <p className="mt-3 text-[17px] leading-[1.65] text-cine-cream/90">
                  {current.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
