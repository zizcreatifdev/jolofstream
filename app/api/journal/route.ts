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
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "20"))
    )
    const entityType = searchParams.get("entityType") ?? ""
    const userId = searchParams.get("userId") ?? ""
    const search = searchParams.get("search") ?? ""

    const where = {
      AND: [
        entityType ? { entityType } : {},
        userId ? { userId } : {},
        search
          ? {
              description: { contains: search, mode: "insensitive" as const },
            }
          : {},
      ],
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      logs,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.warn("[api/journal GET]", error)
    return NextResponse.json({ logs: [], total: 0, pages: 1 })
  }
}
