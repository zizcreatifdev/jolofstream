import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  type: z
    .enum(["entreprise", "particulier", "createur", "association"])
    .optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  organization: z.string().optional(),
  acquisitionChannel: z.string().optional(),
  status: z.enum(["prospect", "actif", "inactif", "vip"]).optional(),
  tvaExempt: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: { orderBy: { createdAt: "desc" }, take: 20 },
        quotes: { orderBy: { createdAt: "desc" }, take: 20 },
        invoices: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: {
          select: { projects: true, quotes: true, invoices: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("[api/clients/:id GET]", error)
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
    const data = updateSchema.parse(body)

    const client = await prisma.client.update({
      where: { id: params.id },
      data,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Client",
        entityId: client.id,
        description: `Client modifie : ${client.name}`,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/clients/:id PATCH]", error)
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
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })
    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      )
    }

    await prisma.client.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "Client",
        entityId: params.id,
        description: `Client supprime : ${client.name}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/clients/:id DELETE]", error)
    return NextResponse.json(
      {
        error:
          "Suppression impossible. Verifiez que le client n'a pas de projet, devis ou facture associes.",
      },
      { status: 500 }
    )
  }
}
