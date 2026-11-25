import type { Metadata } from "next"
import { Suspense } from "react"

import { getSiteContents } from "@/lib/home-data"
import { getPublishedAlbums } from "@/lib/gallery-public"
import { pageMetadata } from "@/lib/seo"
import { CineButton, PAD } from "@/components/public/cine/primitives"
import { PageHeader } from "@/components/public/cine/page-header"
import { GalleryBoard } from "@/components/public/galerie/gallery-board"
import { AlbumGrid } from "@/components/public/galerie/album-grid"

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const { galerie_page: page } = await getSiteContents(["galerie_page"])
  return pageMetadata({
    title: "Galerie",
    description:
      page?.lead ||
      "Galerie photos de Jolof Stream : événements diffusés en direct, formations et coulisses de nos tournages, album par album.",
    path: "/galerie",
  })
}

export default async function GaleriePage() {
  const [contents, albums] = await Promise.all([getSiteContents(["galerie_page", "page_heroes"]), getPublishedAlbums()])
  const page = contents.galerie_page

  return (
    <>
      {page && (
        <PageHeader
          path="/galerie"
          kicker={page.kicker}
          title={page.title}
          accent={page.titleAccent}
          lead={page.lead}
          hero={contents.page_heroes?.galerie ?? null}
        />
      )}

      <section className={`bg-cine-bg pb-[110px] pt-20 text-cine-cream ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="sr-only">Albums</h2>
          {albums.length === 0 ? (
            <div className="rounded-xl bg-cine-bg3 p-[clamp(28px,4vw,48px)] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]">
              <p className="font-display text-[clamp(32px,4vw,48px)] leading-none">{page?.emptyTitle}</p>
              {page?.emptyText && (
                <p className="mb-6 mt-4 max-w-[560px] text-[16px] leading-[1.7] text-cine-cream/70">{page.emptyText}</p>
              )}
              <CineButton href="/contact" variant="red" arrow className={page?.emptyText ? undefined : "mt-6"}>
                Nous contacter
              </CineButton>
            </div>
          ) : (
            <Suspense fallback={<AlbumGrid albums={albums} />}>
              <GalleryBoard albums={albums} />
            </Suspense>
          )}
        </div>
      </section>
    </>
  )
}
