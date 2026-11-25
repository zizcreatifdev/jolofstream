"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_KEYS, isGalleryCategory, type GalleryCategory } from "@/lib/gallery-constants"
import type { PublicAlbumCard } from "@/lib/gallery-public"
import { AlbumGrid } from "@/components/public/galerie/album-grid"

// Filtres de /galerie : Tous et les catégories qui ont au moins un album
// publié, reflétés dans ?categorie=
export function GalleryBoard({ albums }: { albums: PublicAlbumCard[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categories = GALLERY_CATEGORY_KEYS.filter((c) => albums.some((a) => a.category === c))
  const param = searchParams.get("categorie")
  const active: GalleryCategory | null = isGalleryCategory(param) && categories.includes(param) ? param : null
  const shown = active ? albums.filter((a) => a.category === active) : albums

  const choose = (c: GalleryCategory | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (c) params.set("categorie", c)
    else params.delete("categorie")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-7">
        {categories.length > 1 && (
          <div role="group" aria-label="Filtrer les albums" className="flex flex-wrap gap-2">
            {[null, ...categories].map((c) => {
              const on = c === active
              return (
                <button
                  key={c ?? "tous"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(c)}
                  className={cn(
                    "min-h-[44px] rounded-full px-[18px] text-[14px] font-semibold transition-colors",
                    on
                      ? "bg-cine-yellow text-cine-bg"
                      : "text-cine-cream/70 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.2)] hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(244,240,234,0.55)]"
                  )}
                >
                  {c ? GALLERY_CATEGORIES[c] : "Tous"}
                </button>
              )
            })}
          </div>
        )}
        <p aria-live="polite" className="font-mono text-[12px] text-cine-cream/65">
          {shown.length} album{shown.length > 1 ? "s" : ""}
        </p>
      </div>
      <AlbumGrid albums={shown} />
    </div>
  )
}
