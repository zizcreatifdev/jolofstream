import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { albumPatchSchema } from "@/lib/gallery"
import { logGallery, removeGalleryFiles, revalidateAlbum } from "@/lib/gallery-server"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

export const dynamic = "force-dynamic"

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
      include: { photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    return NextResponse.json(album)
  } catch (error) {
    return errorResponse(error, "GET album")
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const data = albumPatchSchema.parse(await req.json())
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
      include: { _count: { select: { photos: true } } },
    })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    if (data.published === true && album._count.photos === 0) {
      return NextResponse.json(
        { error: "Ajoutez au moins une photo avant de publier l'album.", issues: { published: ["Au moins une photo requise"] } },
        { status: 400 }
      )
    }
    if (data.slug && data.slug !== album.slug) {
      const taken = await prisma.galleryAlbum.findUnique({ where: { slug: data.slug }, select: { id: true } })
      if (taken) {
        return NextResponse.json({ error: "Ce slug est déjà utilisé par un autre album.", issues: { slug: ["Slug déjà utilisé"] } }, { status: 409 })
      }
    }
    if (data.programId) {
      const program = await prisma.trainingProgram.findUnique({ where: { id: data.programId }, select: { id: true } })
      if (!program) return NextResponse.json({ error: "Formation introuvable", issues: { programId: ["Formation introuvable"] } }, { status: 400 })
    }
    if (data.coverPhotoId) {
      const photo = await prisma.galleryPhoto.findFirst({ where: { id: data.coverPhotoId, albumId: album.id }, select: { id: true } })
      if (!photo) return NextResponse.json({ error: "Photo de couverture introuvable dans cet album" }, { status: 400 })
    }
    const updated = await prisma.galleryAlbum.update({
      where: { id: album.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date ? new Date(`${data.date}T12:00:00Z`) : null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.coverPhotoId !== undefined && { coverPhotoId: data.coverPhotoId }),
      },
    })
    const what =
      data.published !== undefined && Object.keys(data).length === 1
        ? data.published
          ? "publié"
          : "repassé en brouillon"
        : data.coverPhotoId !== undefined && Object.keys(data).length === 1
          ? "nouvelle couverture"
          : "modifié"
    await logGallery(auth.userId, "UPDATE", album.id, `Album ${what} : ${updated.title}`)
    revalidateAlbum(updated, album.slug)
    if (album.programId && album.programId !== updated.programId) revalidateAlbum({ slug: updated.slug, programId: album.programId })
    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse(error, "PATCH album")
  }
}

// Suppression de l'album, de ses photos et de leurs fichiers
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: params.id },
      include: { photos: { select: { path: true, thumbPath: true } } },
    })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    await prisma.galleryAlbum.delete({ where: { id: album.id } })
    await removeGalleryFiles(album.photos)
    await logGallery(auth.userId, "DELETE", album.id, `Album supprimé : ${album.title} (${album.photos.length} photos)`)
    revalidateAlbum(album)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "DELETE album")
  }
}
