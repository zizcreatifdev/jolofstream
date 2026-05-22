import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const contactSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().trim().optional().or(z.literal("")),
  lastName: z.string().trim().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  lists: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const list = searchParams.get("list") ?? ""
    const unsubscribedParam = searchParams.get("unsubscribed")
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )

    const where: Record<string, unknown> = {}
    if (list) where.lists = { has: list }
    if (unsubscribedParam === "true") where.unsubscribed = true
    else if (unsubscribedParam === "false") where.unsubscribed = false
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, contacts, totalAll, totalUnsub] = await Promise.all([
      prisma.marketingContact.count({ where }),
      prisma.marketingContact.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, organization: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketingContact.count(),
      prisma.marketingContact.count({ where: { unsubscribed: true } }),
    ])

    return NextResponse.json({
      contacts,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: totalAll,
        actifs: totalAll - totalUnsub,
        desabonnes: totalUnsub,
      },
    })
  } catch (error) {
    console.warn("[api/marketing/contacts GET]", error)
    return NextResponse.json({
      contacts: [],
      total: 0,
      pages: 1,
      stats: { total: 0, actifs: 0, desabonnes: 0 },
    })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = contactSchema.parse(body)
    const normalized = data.email.toLowerCase().trim()

    const existing = await prisma.marketingContact.findUnique({
      where: { email: normalized },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Un contact avec cet email existe deja." },
        { status: 409 }
      )
    }

    const contact = await prisma.marketingContact.create({
      data: {
        email: normalized,
        firstName: data.firstName?.trim() || null,
        lastName: data.lastName?.trim() || null,
        clientId: data.clientId?.trim() || null,
        lists: data.lists,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "MarketingContact",
        entityId: contact.id,
        description: `Contact marketing ajoute : ${contact.email}`,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/contacts POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
