import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const readParam = searchParams.get("read")
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "20"))
    )

    const where: Record<string, unknown> = { userId: session.user.id }
    if (readParam === "true") where.read = true
    else if (readParam === "false") where.read = false

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unread_count: unreadCount,
    })
  } catch (error) {
    console.warn("[api/notifications GET]", error)
    return NextResponse.json({ notifications: [], unread_count: 0 })
  }
}
