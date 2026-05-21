import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const clientSchema = z.object({
  type: z.enum(["entreprise", "particulier", "createur", "association"]),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  organization: z.string().optional(),
  acquisitionChannel: z.string().optional(),
  status: z.enum(["prospect", "actif", "inactif", "vip"]).default("prospect"),
  tvaExempt: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const type = searchParams.get("type") ?? ""

    const clients = await prisma.client.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { organization: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          status ? { status } : {},
          type ? { type } : {},
        ],
      },
      include: {
        _count: {
          select: { projects: true, quotes: true, invoices: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("[api/clients GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = clientSchema.parse(body)

    const client = await prisma.client.create({ data })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Client",
        entityId: client.id,
        description: `Client cree : ${client.name}`,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/clients POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
