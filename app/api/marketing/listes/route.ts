import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LISTES_PREDEFINIES } from "@/lib/marketing"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const contacts = await prisma.marketingContact.findMany({
      select: { lists: true, unsubscribed: true },
    })

    const counts: Record<string, number> = {}
    for (const l of LISTES_PREDEFINIES) counts[l] = 0

    for (const c of contacts) {
      if (c.unsubscribed) continue
      for (const l of c.lists ?? []) {
        if (!l) continue
        counts[l] = (counts[l] ?? 0) + 1
      }
    }

    const listes = Array.from(
      new Set([...LISTES_PREDEFINIES, ...Object.keys(counts)])
    )

    return NextResponse.json({ listes, counts })
  } catch (error) {
    console.warn("[api/marketing/listes GET]", error)
    return NextResponse.json({
      listes: [...LISTES_PREDEFINIES],
      counts: {},
    })
  }
}
