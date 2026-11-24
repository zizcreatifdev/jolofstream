import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TESTIMONIAL_PATHS, revalidateSite } from "@/lib/revalidate-site"
import { removeReplacedFiles } from "@/lib/storage-cleanup"
import { testimonialInputSchema, toTestimonialView } from "@/lib/testimonials"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const existing = await prisma.testimonial.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Temoignage introuvable" }, { status: 404 })
    }
    // Mise a jour complete validee : publication refusee sans accord (400)
    const data = testimonialInputSchema.parse(await req.json())
    const updated = await prisma.testimonial.update({
      where: { id: params.id },
      data,
    })
    await removeReplacedFiles("site", [existing.photoUrl], [updated.photoUrl])
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Testimonial",
        entityId: updated.id,
        description: `Temoignage modifie : ${updated.authorName}${updated.published ? " (publie)" : " (brouillon)"}`,
      },
    })
    revalidateSite(TESTIMONIAL_PATHS)
    return NextResponse.json(toTestimonialView(updated))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/testimonials/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const existing = await prisma.testimonial.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Temoignage introuvable" }, { status: 404 })
    }
    await prisma.testimonial.delete({ where: { id: params.id } })
    await removeReplacedFiles("site", [existing.photoUrl], [])
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Testimonial",
        entityId: existing.id,
        description: `Temoignage supprime : ${existing.authorName}`,
      },
    })
    revalidateSite(TESTIMONIAL_PATHS)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/testimonials/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
