import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { GALLERY_CATEGORIES, albumDateLabel } from "@/lib/gallery-constants"
import { getPublishedAlbum } from "@/lib/gallery-public"
import { pageMetadata, CANONICAL_ORIGIN } from "@/lib/seo"
import { sceneKicker } from "@/lib/site-nav"
import { JsonLd } from "@/components/public/json-ld"
import { CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"
import { AlbumPhotos } from "@/components/public/galerie/album-photos"

export const revalidate = 60
export const dynamicParams = true

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const album = await getPublishedAlbum(params.slug)
  if (!album) return { title: "Album introuvable", robots: { index: false, follow: true } }
  const date = albumDateLabel(album.date)
  return pageMetadata({
    title: `${album.title} : galerie`,
    description:
      album.description?.slice(0, 300) ||
      `${GALLERY_CATEGORIES[album.category]}${date ? `, ${date}` : ""} : ${album.photoCount} photos de Jolof Stream.`,
    path: `/galerie/${album.slug}`,
    image: { url: album.cover.url, width: album.cover.width, height: album.cover.height, alt: album.cover.alt },
  })
}

export default async function AlbumPage({ params }: { params: { slug: string } }) {
  const album = await getPublishedAlbum(params.slug)
  if (!album) notFound()
  const date = albumDateLabel(album.date)
  const url = `${CANONICAL_ORIGIN}/galerie/${album.slug}`

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: album.title,
          url,
          ...(album.description && { description: album.description }),
          ...(album.date && { datePublished: album.date.slice(0, 10) }),
          dateModified: album.updatedAt.slice(0, 10),
          numberOfItems: album.photoCount,
          publisher: { "@type": "Organization", name: "Jolof Stream", url: CANONICAL_ORIGIN },
          image: album.photos.slice(0, 30).map((p) => ({
            "@type": "ImageObject",
            contentUrl: p.url,
            thumbnailUrl: p.thumbUrl,
            width: p.width,
            height: p.height,
            ...(p.caption ? { caption: p.caption } : { caption: p.alt }),
          })),
        }}
      />
      <section className={`bg-black pb-[70px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/galerie"
            className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-cine-cream/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la galerie
          </Link>
          <Kicker>
            {sceneKicker("/galerie", GALLERY_CATEGORIES[album.category])}
            {date ? ` · ${date}` : ""}
          </Kicker>
          <CineHeading as="h1" title={album.title} className="mt-[22px] text-[clamp(48px,7vw,120px)] leading-[0.9]" />
          {album.description && (
            <p className="mt-[22px] max-w-[640px] whitespace-pre-line text-[18px] leading-[1.7] text-cine-cream/70">{album.description}</p>
          )}
          <p className="mt-5 font-mono text-[12px] text-cine-cream/65">
            {album.photoCount} photo{album.photoCount > 1 ? "s" : ""}
          </p>
        </div>
      </section>
      <section className={`bg-cine-bg pb-[110px] pt-14 text-cine-cream ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="sr-only">Photos de l&apos;album</h2>
          <AlbumPhotos photos={album.photos} albumTitle={album.title} />
        </div>
      </section>
    </>
  )
}
