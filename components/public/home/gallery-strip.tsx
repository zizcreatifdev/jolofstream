import Link from "next/link"

import type { StripPhoto } from "@/lib/gallery-public"
import type { HomeSections } from "@/lib/site-content"
import { CineButton, CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"

// Bande Galerie de l'accueil : 10 photos les plus récentes des albums
// publiés, défilement horizontal aimanté (sans épinglage), chaque photo mène
// à son album. Composant serveur, aucun JavaScript. Masquée sans photo.
export function GalleryStrip({ sections, photos }: { sections: HomeSections; photos: StripPhoto[] }) {
  if (photos.length === 0) return null
  return (
    <section aria-labelledby="accueil-galerie" className="bg-cine-bg py-[100px] text-cine-cream min-[761px]:py-[130px]">
      <div className={`mx-auto mb-12 flex max-w-[1440px] flex-wrap items-end justify-between gap-6 ${PAD} min-[1440px]:px-0`}>
        <div>
          {sections.galleryKicker && <Kicker>{sections.galleryKicker}</Kicker>}
          {sections.galleryTitle ? (
            <div id="accueil-galerie">
              <CineHeading title={sections.galleryTitle} accent={sections.galleryTitleAccent} breakLine={false} />
            </div>
          ) : (
            <h2 id="accueil-galerie" className="sr-only">
              Galerie
            </h2>
          )}
        </div>
        <CineButton href="/galerie" variant="outDark" arrow>
          Voir la galerie
        </CineButton>
      </div>
      <ul
        aria-label="Photos récentes de la galerie"
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:thin] ${PAD} scroll-px-[clamp(18px,4.5vw,72px)]`}
      >
        {photos.map((photo) => (
          <li key={photo.id} className="shrink-0 snap-start">
            <Link
              href={`/galerie/${photo.albumSlug}`}
              className="group relative block h-[clamp(220px,34vw,380px)] overflow-hidden rounded-md bg-cine-bg3"
            >
              <span className="sr-only">Album {photo.albumTitle} : </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="h-full w-auto max-w-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
