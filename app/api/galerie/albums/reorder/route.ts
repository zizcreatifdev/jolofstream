import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { GALLERY_PATHS, idsSchema } from "@/lib/gallery"
import { logGallery } from "@/lib/gallery-server"
import { revalidateSite } from "@/lib/revalidate-site"
import { errorResponse, requireAdmin } from "@/app/api/galerie/_auth"

// Nouvel ordre des albums (liste complète des identifiants)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    const { ids } = idsSchema.parse(await req.json())
    const count = await prisma.galleryAlbum.count({ where: { id: { in: ids } } })
    if (count !== ids.length || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "Liste d'albums invalide" }, { status: 400 })
    }
    await prisma.$transaction(ids.map((id, order) => prisma.galleryAlbum.update({ where: { id }, data: { order } })))
    await logGallery(auth.userId, "UPDATE", "ordre", "Ordre des albums de la galerie modifié")
    revalidateSite([...GALLERY_PATHS, "/sitemap.xml"])
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "POST reorder")
  }
}
