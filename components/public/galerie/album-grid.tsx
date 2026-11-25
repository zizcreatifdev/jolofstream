import Link from "next/link"

import { GALLERY_CATEGORIES, albumDateLabel } from "@/lib/gallery-constants"
import type { PublicAlbumCard } from "@/lib/gallery-public"

// Grille des albums : couverture (miniature servie telle quelle, sans
// optimisation Vercel), titre, date, nombre de photos
export function AlbumGrid({ albums }: { albums: PublicAlbumCard[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-x-5 gap-y-10">
      {albums.map((album, i) => {
        const date = albumDateLabel(album.date)
        return (
          <li key={album.id}>
            <Link href={`/galerie/${album.slug}`} className="group block rounded-md">
              <span className="relative block aspect-[4/3] overflow-hidden rounded-md bg-cine-bg3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover.url}
                  alt={album.cover.alt}
                  width={album.cover.width}
                  height={album.cover.height}
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </span>
              <span className="mt-4 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cine-yellow">
                {GALLERY_CATEGORIES[album.category]}
                {date ? ` · ${date}` : ""}
              </span>
              <span className="mt-2 block font-display text-[clamp(28px,2.6vw,36px)] leading-[1.02] tracking-[-0.02em] text-cine-cream group-hover:text-white">
                {album.title}
              </span>
              <span className="mt-1.5 block text-[14px] text-cine-cream/70">
                {album.photoCount} photo{album.photoCount > 1 ? "s" : ""}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
