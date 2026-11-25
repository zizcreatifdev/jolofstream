import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { idsSchema } from "@/lib/gallery"
import { logGallery, revalidateAlbum } from "@/lib/gallery-server"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

// Nouvel ordre des photos d'un album (liste complète des identifiants)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const { ids } = idsSchema.parse(await req.json())
    const album = await prisma.galleryAlbum.findUnique({ where: { id: params.id } })
    if (!album) return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
    const count = await prisma.galleryPhoto.count({ where: { albumId: album.id } })
    const owned = await prisma.galleryPhoto.count({ where: { albumId: album.id, id: { in: ids } } })
    if (owned !== ids.length || count !== ids.length || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "Liste de photos invalide" }, { status: 400 })
    }
    await prisma.$transaction(ids.map((id, order) => prisma.galleryPhoto.update({ where: { id }, data: { order } })))
    await logGallery(auth.userId, "UPDATE", album.id, `Ordre des photos modifié : ${album.title}`)
    revalidateAlbum(album)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "POST photos reorder")
  }
}
