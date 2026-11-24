import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TESTIMONIAL_PATHS, revalidateSite } from "@/lib/revalidate-site"
import { testimonialInputSchema, toTestimonialView } from "@/lib/testimonials"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const rows = await prisma.testimonial.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ testimonials: rows.map(toTestimonialView) })
  } catch (error) {
    console.error("[api/testimonials GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const data = testimonialInputSchema.parse(await req.json())
    const last = await prisma.testimonial.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const created = await prisma.testimonial.create({
      data: { ...data, order: (last?.order ?? -1) + 1 },
    })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Testimonial",
        entityId: created.id,
        description: `Temoignage cree : ${created.authorName}${created.published ? " (publie)" : " (brouillon)"}`,
      },
    })
    revalidateSite(TESTIMONIAL_PATHS)
    return NextResponse.json(toTestimonialView(created), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/testimonials POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
