import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { GALLERY_CATEGORIES, albumInputSchema, gallerySlugify } from "@/lib/gallery"
import { logGallery, revalidateAlbum, uniqueAlbumSlug } from "@/lib/gallery-server"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

export const dynamic = "force-dynamic"

// Liste des albums pour l'admin : couverture, nombre de photos, statut
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const albums = await prisma.galleryAlbum.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { photos: true } },
        photos: { orderBy: { order: "asc" }, take: 1, select: { id: true, thumbUrl: true } },
        program: { select: { name: true } },
      },
    })
    const covers = await prisma.galleryPhoto.findMany({
      where: { id: { in: albums.map((a) => a.coverPhotoId).filter((x): x is string => Boolean(x)) } },
      select: { id: true, thumbUrl: true },
    })
    const coverById = new Map(covers.map((c) => [c.id, c.thumbUrl]))
    return NextResponse.json(
      albums.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        category: a.category,
        date: a.date?.toISOString() ?? null,
        published: a.published,
        order: a.order,
        photoCount: a._count.photos,
        coverUrl: (a.coverPhotoId && coverById.get(a.coverPhotoId)) || a.photos[0]?.thumbUrl || null,
        programName: a.program?.name ?? null,
      }))
    )
  } catch (error) {
    return errorResponse(error, "GET albums")
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const raw = { ...body, slug: typeof body?.slug === "string" && body.slug ? body.slug : gallerySlugify(String(body?.title ?? "")) }
    const data = albumInputSchema.parse(raw)
    if (data.programId) {
      const program = await prisma.trainingProgram.findUnique({ where: { id: data.programId }, select: { id: true } })
      if (!program) return NextResponse.json({ error: "Formation introuvable", issues: { programId: ["Formation introuvable"] } }, { status: 400 })
    }
    const slug = await uniqueAlbumSlug(data.slug)
    const last = await prisma.galleryAlbum.aggregate({ _max: { order: true } })
    const album = await prisma.galleryAlbum.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        date: data.date ? new Date(`${data.date}T12:00:00Z`) : null,
        category: data.category,
        programId: data.programId,
        order: (last._max.order ?? -1) + 1,
      },
    })
    await logGallery(auth.userId, "CREATE", album.id, `Album créé : ${album.title} (${GALLERY_CATEGORIES[data.category]})`)
    revalidateAlbum(album)
    return NextResponse.json(album, { status: 201 })
  } catch (error) {
    return errorResponse(error, "POST albums")
  }
}
