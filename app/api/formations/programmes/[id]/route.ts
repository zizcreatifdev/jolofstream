import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cohortStoredTitle } from "@/lib/formations"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"
import { removeReplacedFiles } from "@/lib/storage-cleanup"
import { programInputSchema } from "@/lib/training-programs"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: params.id },
      include: {
        cohorts: { orderBy: [{ dateStart: "desc" }, { createdAt: "desc" }] },
        testimonials: { orderBy: { order: "asc" } },
      },
    })
    if (!program) {
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    return NextResponse.json(program)
  } catch (error) {
    console.error("[api/formations/programmes/:id GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const data = programInputSchema.parse(await req.json())
    const existing = await prisma.trainingProgram.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    if (data.slug !== existing.slug) {
      const taken = await prisma.trainingProgram.findUnique({ where: { slug: data.slug } })
      if (taken) {
        return NextResponse.json(
          { error: "Cette adresse est déjà utilisée par un autre programme.", issues: { slug: ["Adresse déjà utilisée"] } },
          { status: 409 }
        )
      }
    }
    const updated = await prisma.$transaction(async (tx) => {
      const program = await tx.trainingProgram.update({ where: { id: params.id }, data })
      // Nom change : titres stockes des cohortes recalcules
      if (program.name !== existing.name) {
        const cohorts = await tx.trainingSession.findMany({
          where: { programId: program.id },
          select: { id: true, label: true },
        })
        for (const c of cohorts) {
          await tx.trainingSession.update({
            where: { id: c.id },
            data: { title: cohortStoredTitle(program.name, c.label) },
          })
        }
      }
      return program
    })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingProgram",
        entityId: updated.id,
        description: `Fiche du programme modifiée : ${updated.name}`,
      },
    })
    revalidateSite([...FORMATION_PATHS, `/formations/${existing.slug}`, `/formations/${updated.slug}`])
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/formations/programmes/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Suppression refusee (409) tant que le programme a des cohortes
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: params.id },
      include: { _count: { select: { cohorts: true } } },
    })
    if (!program) {
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    if (program._count.cohorts > 0) {
      return NextResponse.json(
        {
          error: `Suppression impossible : ce programme a ${program._count.cohorts} cohorte${program._count.cohorts > 1 ? "s" : ""}. Masquez-le plutôt.`,
        },
        { status: 409 }
      )
    }
    await prisma.trainingProgram.delete({ where: { id: params.id } })
    await removeReplacedFiles("formations", [program.brochureUrl], [])
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "TrainingProgram",
        entityId: params.id,
        description: `Programme de formation supprimé : ${program.name}`,
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/formations/programmes/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
