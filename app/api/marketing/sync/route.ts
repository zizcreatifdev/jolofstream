import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const clients = await prisma.client.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    let synchronises = 0
    let dejaPresents = 0

    for (const c of clients) {
      if (!c.email) continue
      const normalized = c.email.toLowerCase().trim()
      const existing = await prisma.marketingContact.findUnique({
        where: { email: normalized },
        select: { id: true },
      })
      if (existing) {
        dejaPresents += 1
        continue
      }
      const parts = c.name.trim().split(/\s+/)
      const firstName = parts[0] || null
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null
      await prisma.marketingContact.create({
        data: {
          email: normalized,
          firstName,
          lastName,
          clientId: c.id,
          lists: ["clients"],
        },
      })
      synchronises += 1
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "MarketingContact",
        entityId: "sync",
        description: `Synchronisation CRM -> Marketing : ${synchronises} nouveaux contacts (${dejaPresents} deja presents)`,
      },
    })

    return NextResponse.json({
      synchronises,
      deja_presents: dejaPresents,
    })
  } catch (error) {
    console.error("[api/marketing/sync]", error)
    return NextResponse.json(
      { error: "Erreur de synchronisation" },
      { status: 500 }
    )
  }
}
