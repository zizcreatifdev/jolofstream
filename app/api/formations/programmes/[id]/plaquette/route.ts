import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { FORMATION_PATHS, revalidateSite } from "@/lib/revalidate-site"
import { removeReplacedFiles } from "@/lib/storage-cleanup"
import { BROCHURE_MAX_BYTES, brochureMetaSchema } from "@/lib/training-programs"

export const dynamic = "force-dynamic"

const BUCKET = "formations"

const registerSchema = brochureMetaSchema.extend({
  path: z
    .string()
    .trim()
    .regex(/^plaquettes\/[A-Za-z0-9._-]+\.pdf$/, "Chemin de plaquette invalide"),
})

async function removeFile(path: string) {
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) console.warn("[plaquette] suppression", error)
  } catch (error) {
    console.warn("[plaquette] suppression", error)
  }
}

// Verifie le fichier reellement televerse : signature %PDF- et poids reel
async function inspectPdf(path: string): Promise<{ ok: true; size: number } | { ok: false; error: string }> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path)
  if (error || !data) {
    return { ok: false, error: "Fichier introuvable dans le stockage. Recommencez le téléversement." }
  }
  const buffer = Buffer.from(await data.arrayBuffer())
  if (buffer.length > BROCHURE_MAX_BYTES) {
    return {
      ok: false,
      error: `Fichier trop lourd (${(buffer.length / 1024 / 1024).toFixed(1)} Mo). 10 Mo maximum.`,
    }
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return { ok: false, error: "Ce fichier n'est pas un PDF valide." }
  }
  return { ok: true, size: buffer.length }
}

function errorResponse(error: unknown, scope: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Données invalides", issues: error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  console.error(`[api/formations/programmes/:id/plaquette ${scope}]`, error)
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
}

// Enregistre un PDF televerse (URL signee) : verification, puis suppression de
// l'ancien fichier une fois l'enregistrement reussi
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  let path: string | null = null
  try {
    const data = registerSchema.parse(await req.json())
    path = data.path
    const program = await prisma.trainingProgram.findUnique({ where: { id: params.id } })
    if (!program) {
      await removeFile(data.path)
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    const check = await inspectPdf(data.path)
    if (!check.ok) {
      await removeFile(data.path)
      return NextResponse.json({ error: check.error }, { status: 400 })
    }
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)
    const updated = await prisma.trainingProgram.update({
      where: { id: program.id },
      data: {
        brochureUrl: urlData.publicUrl,
        brochurePath: data.path,
        brochureSize: check.size,
        brochureUpdatedAt: new Date(),
        ...(data.brochureTitle !== null ? { brochureTitle: data.brochureTitle } : {}),
        ...(data.brochureFileName !== null ? { brochureFileName: data.brochureFileName } : {}),
        ...(data.brochurePages !== null ? { brochurePages: data.brochurePages } : {}),
      },
    })
    if (program.brochurePath && program.brochurePath !== data.path) {
      await removeFile(program.brochurePath)
    } else if (program.brochureUrl && program.brochureUrl !== updated.brochureUrl) {
      await removeReplacedFiles(BUCKET, [program.brochureUrl], [updated.brochureUrl])
    }
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingProgram",
        entityId: program.id,
        description: program.brochureUrl
          ? `Plaquette remplacée : ${program.name}`
          : `Plaquette ajoutée : ${program.name}`,
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json(updated)
  } catch (error) {
    if (path && !(error instanceof z.ZodError)) await removeFile(path)
    return errorResponse(error, "POST")
  }
}

// Titre, nom du fichier telecharge, pages, publication
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const data = brochureMetaSchema.parse(await req.json())
    const program = await prisma.trainingProgram.findUnique({ where: { id: params.id } })
    if (!program) {
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    if (data.brochurePublished && !program.brochureUrl) {
      return NextResponse.json(
        { error: "Téléversez d'abord un PDF avant de publier la plaquette." },
        { status: 400 }
      )
    }
    const updated = await prisma.trainingProgram.update({
      where: { id: program.id },
      data: {
        brochureTitle: data.brochureTitle,
        brochureFileName: data.brochureFileName,
        brochurePages: data.brochurePages,
        ...(data.brochurePublished !== undefined ? { brochurePublished: data.brochurePublished } : {}),
      },
    })
    const published =
      data.brochurePublished !== undefined && data.brochurePublished !== program.brochurePublished
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingProgram",
        entityId: program.id,
        description: published
          ? `Plaquette ${updated.brochurePublished ? "publiée" : "dépubliée"} : ${program.name}`
          : `Informations de la plaquette modifiées : ${program.name}`,
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse(error, "PATCH")
  }
}

// Retirer : fichier supprime, champs du fichier remis a vide, depubliee
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const program = await prisma.trainingProgram.findUnique({ where: { id: params.id } })
    if (!program) {
      return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
    }
    const updated = await prisma.trainingProgram.update({
      where: { id: program.id },
      data: {
        brochureUrl: null,
        brochurePath: null,
        brochureSize: null,
        brochurePages: null,
        brochureUpdatedAt: null,
        brochurePublished: false,
      },
    })
    if (program.brochurePath) await removeFile(program.brochurePath)
    else await removeReplacedFiles(BUCKET, [program.brochureUrl], [])
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TrainingProgram",
        entityId: program.id,
        description: `Plaquette retirée : ${program.name}`,
      },
    })
    revalidateSite(FORMATION_PATHS)
    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse(error, "DELETE")
  }
}
