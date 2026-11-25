"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ImageIcon, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { PORTFOLIO_TYPES, PORTFOLIO_TYPE_KEYS, type PortfolioType } from "@/lib/portfolio"
import type { PortfolioWork } from "@/lib/home-data"
import { PortfolioLightbox, type LightboxItem } from "@/components/public/portfolio-lightbox"

// Grille du portfolio (maquette #p-realisations) : filtres par type refletes
// dans ?type=, compteur annonce, cartes ouvrant la lightbox existante
export function PortfolioBoard({ items }: { items: PortfolioWork[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null)

  // Seuls les types qui ont au moins une realisation sont proposes
  const types = PORTFOLIO_TYPE_KEYS.filter((t) => items.some((i) => i.type === t))
  const slugParam = searchParams.get("type")
  const active: PortfolioType | null = types.find((t) => PORTFOLIO_TYPES[t].slug === slugParam) ?? null
  const shown = useMemo(() => (active ? items.filter((i) => i.type === active) : items), [items, active])

  const choose = (t: PortfolioType | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (t) params.set("type", PORTFOLIO_TYPES[t].slug)
    else params.delete("type")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-7">
        {types.length > 1 && (
          <div role="group" aria-label="Filtrer les réalisations" className="flex flex-wrap gap-2">
            {[null, ...types].map((t) => {
              const on = t === active
              return (
                <button
                  key={t ?? "tout"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(t)}
                  className={cn(
                    "min-h-[44px] rounded-full px-[18px] text-[14px] font-semibold transition-colors",
                    on
                      ? "bg-cine-yellow text-cine-bg"
                      : "text-cine-cream/70 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.2)] hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(244,240,234,0.55)]"
                  )}
                >
                  {t ? PORTFOLIO_TYPES[t].publicLabel : "Tout"}
                </button>
              )
            })}
          </div>
        )}
        <p aria-live="polite" className="font-mono text-[12px] text-cine-cream/65">
          {shown.length} réalisation{shown.length > 1 ? "s" : ""}
        </p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4 [grid-auto-rows:300px]">
        {shown.map((item, i) => {
          const tall = i % 8 === 0 || i % 8 === 5
          const wide = i % 8 === 3
          return (
            <li key={item.id} className={cn(tall && "row-span-2", wide && "min-[1000px]:col-span-2")}>
              <button
                type="button"
                onClick={() =>
                  setLightbox({ title: item.title, mediaType: item.mediaType, mediaUrl: item.mediaUrl, youtubeId: item.youtubeId })
                }
                className="group relative block h-full w-full overflow-hidden rounded-md bg-cine-bg3 text-left text-cine-cream"
              >
                {/* Nom accessible : le texte visible, précédé de « Voir : » */}
                <span className="sr-only">Voir : </span>
                {item.thumbnailUrl && (
                  <Image
                    src={item.thumbnailUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1000px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                )}
                <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,3,3,0.94)_0%,rgba(5,3,3,0.8)_62%,rgba(5,3,3,0.2)_100%)]" />
                <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cine-cream">
                  {item.mediaType === "youtube" ? (
                    <Play className="h-3.5 w-3.5 fill-current text-[#FF3344]" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {item.mediaType === "youtube" ? "Vidéo" : "Photo"}
                </span>
                <span className="absolute inset-x-[26px] bottom-[26px] block">
                  <small className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cine-yellow">
                    {item.typeLabel}
                  </small>
                  <strong className="mb-2 mt-2.5 block font-display text-[clamp(30px,3vw,36px)] font-normal leading-none tracking-[-0.02em]">
                    {item.title}
                  </strong>
                  {item.description && (
                    <span className="line-clamp-2 block text-[14px] leading-[1.5] text-cine-cream/70">{item.description}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <PortfolioLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}
