import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CONTRAT_STATUSES, CONTRAT_STATUS_KEYS } from "@/lib/contrats"

const patchSchema = z.object({
  status: z
    .enum(CONTRAT_STATUS_KEYS as [string, ...string[]])
    .optional(),
  notes: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
})

const TRANSITIONS: Record<string, string[]> = {
  a_envoyer: ["envoye", "annule"],
  envoye: ["signe", "refuse", "annule"],
  signe: [],
  refuse: ["annule"],
  annule: [],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        project: true,
        creator: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (!contract) {
      return NextResponse.json(
        { error: "Contrat introuvable" },
        { status: 404 }
      )
    }
    return NextResponse.json(contract)
  } catch (error) {
    console.warn("[api/contrats/[id] GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = patchSchema.parse(body)

    const existing = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Contrat introuvable" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    let activityDescription: string | null = null

    if (data.status && data.status !== existing.status) {
      const allowed = TRANSITIONS[existing.status] ?? []
      if (!allowed.includes(data.status)) {
        return NextResponse.json(
          {
            error: `Transition impossible : ${existing.status} -> ${data.status}.`,
          },
          { status: 400 }
        )
      }
      updateData.status = data.status
      if (data.status === "signe") {
        updateData.signedAt = new Date()
      }
      const label = CONTRAT_STATUSES[data.status as keyof typeof CONTRAT_STATUSES].label
      activityDescription = `Contrat passe au statut "${label}"`
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null
    }
    if (data.fileUrl !== undefined) {
      updateData.fileUrl = data.fileUrl
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun changement" },
        { status: 400 }
      )
    }

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
    })

    if (activityDescription) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "Contract",
          entityId: contract.id,
          description: activityDescription,
        },
      })
    }

    return NextResponse.json(contract)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/contrats/[id] PATCH]", error)
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
    const existing = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Contrat introuvable" },
        { status: 404 }
      )
    }
    if (existing.status !== "a_envoyer") {
      return NextResponse.json(
        {
          error:
            "Seuls les contrats au statut A envoyer peuvent etre supprimes. Utilisez Annuler pour les autres.",
        },
        { status: 403 }
      )
    }

    await prisma.contract.delete({ where: { id: params.id } })
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Contract",
        entityId: params.id,
        description: "Contrat supprime",
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/contrats/[id] DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
