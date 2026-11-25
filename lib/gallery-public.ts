import { prisma } from "@/lib/prisma"
import { isGalleryCategory, photoAlt, type GalleryCategory } from "@/lib/gallery-constants"
import { parseSiteContent, type PageHero, type PageHeroKey } from "@/lib/site-content"

// Lectures publiques de la galerie et des en-têtes de pages (composants
// serveur). Albums visibles : publiés et avec au moins une photo.

export type PublicPhoto = {
  id: string
  url: string
  thumbUrl: string
  width: number
  height: number
  alt: string
  caption: string | null
}

export type PublicAlbumCard = {
  id: string
  slug: string
  title: string
  category: GalleryCategory
  date: string | null
  photoCount: number
  cover: { url: string; width: number; height: number; alt: string }
}

export type PublicAlbum = PublicAlbumCard & {
  description: string | null
  updatedAt: string
  photos: PublicPhoto[]
}

export { albumDateLabel } from "@/lib/gallery-constants"

type AlbumRow = {
  id: string
  slug: string
  title: string
  category: string
  date: Date | null
  coverPhotoId: string | null
  order: number
  photos: Array<{ id: string; thumbUrl: string; width: number; height: number; alt: string | null }>
  _count: { photos: number }
}

function toCard(a: AlbumRow): PublicAlbumCard | null {
  if (!isGalleryCategory(a.category) || a.photos.length === 0) return null
  const index = Math.max(0, a.photos.findIndex((p) => p.id === a.coverPhotoId))
  const cover = a.photos[index]
  // Dimensions de la miniature (800 px au plus sur le côté le plus long)
  const scale = Math.min(1, 800 / Math.max(cover.width, cover.height))
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    date: a.date?.toISOString() ?? null,
    photoCount: a._count.photos,
    cover: {
      url: cover.thumbUrl,
      width: Math.round(cover.width * scale),
      height: Math.round(cover.height * scale),
      alt: photoAlt(a.title, cover.alt, index),
    },
  }
}

// Albums publiés, du plus récent au plus ancien (puis ordre de l'admin)
export async function getPublishedAlbums(): Promise<PublicAlbumCard[]> {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { published: true, photos: { some: {} } },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { order: "asc" }, { createdAt: "desc" }],
      include: {
        photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, thumbUrl: true, width: true, height: true, alt: true } },
        _count: { select: { photos: true } },
      },
    })
    return albums.map(toCard).filter((a): a is PublicAlbumCard => Boolean(a))
  } catch (error) {
    console.error("[galerie] albums", error)
    return []
  }
}

export async function getPublishedAlbum(slug: string): Promise<PublicAlbum | null> {
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { slug },
      include: {
        photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
        _count: { select: { photos: true } },
      },
    })
    if (!album || !album.published || album.photos.length === 0) return null
    const card = toCard(album)
    if (!card) return null
    return {
      ...card,
      description: album.description,
      updatedAt: album.updatedAt.toISOString(),
      photos: album.photos.map((p, i) => ({
        id: p.id,
        url: p.url,
        thumbUrl: p.thumbUrl,
        width: p.width,
        height: p.height,
        alt: photoAlt(album.title, p.alt, i),
        caption: p.caption,
      })),
    }
  } catch (error) {
    console.error("[galerie] album", error)
    return null
  }
}

export type StripPhoto = { id: string; thumbUrl: string; width: number; height: number; alt: string; albumSlug: string; albumTitle: string }

// Photos les plus récentes des albums publiés (bande de l'accueil)
export async function getRecentGalleryPhotos(limit = 10): Promise<StripPhoto[]> {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      where: { album: { published: true } },
      orderBy: [{ createdAt: "desc" }, { order: "asc" }],
      take: limit,
      include: { album: { select: { slug: true, title: true } } },
    })
    return photos.map((p) => {
      const scale = Math.min(1, 800 / Math.max(p.width, p.height))
      return {
        id: p.id,
        thumbUrl: p.thumbUrl,
        width: Math.round(p.width * scale),
        height: Math.round(p.height * scale),
        alt: p.alt?.trim() || `${p.album.title}, photo ${p.order + 1}`,
        albumSlug: p.album.slug,
        albumTitle: p.album.title,
      }
    })
  } catch (error) {
    console.error("[galerie] photos récentes", error)
    return []
  }
}

export type ProgramAlbum = { slug: string; title: string; photos: Array<Omit<StripPhoto, "albumSlug" | "albumTitle">> }

// Album publié lié à chaque programme (le plus récent), 6 miniatures
export async function getProgramAlbums(programIds: string[]): Promise<Record<string, ProgramAlbum>> {
  if (programIds.length === 0) return {}
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { published: true, programId: { in: programIds }, photos: { some: {} } },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { order: "asc" }],
      include: { photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], take: 6 } },
    })
    const out: Record<string, ProgramAlbum> = {}
    for (const a of albums) {
      if (!a.programId || out[a.programId]) continue
      out[a.programId] = {
        slug: a.slug,
        title: a.title,
        photos: a.photos.map((p, i) => {
          const scale = Math.min(1, 800 / Math.max(p.width, p.height))
          return {
            id: p.id,
            thumbUrl: p.thumbUrl,
            width: Math.round(p.width * scale),
            height: Math.round(p.height * scale),
            alt: photoAlt(a.title, p.alt, i),
          }
        }),
      }
    }
    return out
  } catch (error) {
    console.error("[galerie] albums des programmes", error)
    return {}
  }
}

// Image d'en-tête d'une page (null : en-tête sans image)
export async function getPageHero(key: PageHeroKey): Promise<PageHero | null> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "page_heroes" } })
    return parseSiteContent("page_heroes", setting?.value)?.[key] ?? null
  } catch {
    return null
  }
}
