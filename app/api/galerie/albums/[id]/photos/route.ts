import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { MAX_PHOTOS_PER_ALBUM, idsSchema, photosInputSchema } from "@/lib/gallery"
import { logGallery, removeGalleryFiles, revalidateAlbum } from "@/lib/gallery-server"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

type Ctx = { params: { id: string } }

// Enregistre les photos déjà envoyées dans le bucket galerie (dossier de l'album)
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const { photos } = photosInputSchema.parse(await req.json())
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
      include: { _count: { select: { photos: true } } },
    })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    const folder = `albums/${album.id}/`
    if (photos.some((p) => !p.path.startsWith(folder) || !p.thumbPath.startsWith(folder))) {
      return NextResponse.json({ error: "Fichier hors du dossier de l'album" }, { status: 400 })
    }
    if (album._count.photos + photos.length > MAX_PHOTOS_PER_ALBUM) {
      return NextResponse.json(
        { error: `${MAX_PHOTOS_PER_ALBUM} photos maximum par album (${album._count.photos} déjà présentes).` },
        { status: 400 }
      )
    }
    const last = await prisma.galleryPhoto.aggregate({ where: { albumId: album.id }, _max: { order: true } })
    const start = (last._max.order ?? -1) + 1
    const created = await prisma.$transaction(
      photos.map((p, i) =>
        prisma.galleryPhoto.create({
          data: { albumId: album.id, url: p.url, path: p.path, thumbUrl: p.thumbUrl, thumbPath: p.thumbPath, width: p.width, height: p.height, order: start + i },
        })
      )
    )
    await logGallery(auth.userId, "UPDATE", album.id, `${created.length} photo${created.length > 1 ? "s" : ""} ajoutée${created.length > 1 ? "s" : ""} : ${album.title}`)
    revalidateAlbum(album)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return errorResponse(error, "POST photos")
  }
}

// Suppression d'une ou plusieurs photos et de leurs fichiers
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const { ids } = idsSchema.parse(await req.json())
    const album = await prisma.galleryAlbum.findUnique({ where: { id: params.id } })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    const photos = await prisma.galleryPhoto.findMany({
      where: { albumId: album.id, id: { in: ids } },
      select: { id: true, path: true, thumbPath: true },
    })
    if (photos.length === 0) return NextResponse.json({ error: "Aucune photo trouvée" }, { status: 404 })
    await prisma.galleryPhoto.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } })
    const remaining = await prisma.galleryPhoto.count({ where: { albumId: album.id } })
    // Couverture supprimée : retour à la première photo ; plus de photo : brouillon
    const updated = await prisma.galleryAlbum.update({
      where: { id: album.id },
      data: {
        ...(album.coverPhotoId && photos.some((p) => p.id === album.coverPhotoId) && { coverPhotoId: null }),
        ...(remaining === 0 && album.published && { published: false }),
      },
    })
    await removeGalleryFiles(photos)
    await logGallery(
      auth.userId,
      "DELETE",
      album.id,
      `${photos.length} photo${photos.length > 1 ? "s" : ""} supprimée${photos.length > 1 ? "s" : ""} : ${album.title}${remaining === 0 && album.published ? " (album repassé en brouillon)" : ""}`
    )
    revalidateAlbum(album)
    return NextResponse.json({ success: true, deleted: photos.length, remaining, published: updated.published })
  } catch (error) {
    return errorResponse(error, "DELETE photos")
  }
}
