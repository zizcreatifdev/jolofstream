import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { photoPatchSchema } from "@/lib/gallery"
import { logGallery, revalidateAlbum } from "@/lib/gallery-server"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

// Texte alternatif et légende d'une photo
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const data = photoPatchSchema.parse(await req.json())
    const photo = await prisma.galleryPhoto.findUnique({ where: { id: params.id }, include: { album: true } })
    if (!photo) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 })
    const updated = await prisma.galleryPhoto.update({
      where: { id: photo.id },
      data: {
        ...(data.alt !== undefined && { alt: data.alt }),
        ...(data.caption !== undefined && { caption: data.caption }),
      },
    })
    await logGallery(auth.userId, "UPDATE", photo.albumId, `Texte de photo modifié : ${photo.album.title}`)
    revalidateAlbum(photo.album)
    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse(error, "PATCH photo")
  }
}
