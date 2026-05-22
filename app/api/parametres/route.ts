import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keysParam = searchParams.get("keys")
    const where = keysParam
      ? { key: { in: keysParam.split(",").map((s) => s.trim()).filter(Boolean) } }
      : undefined

    const settings = await prisma.setting.findMany({ where })
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/parametres GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>
    const entries = Object.entries(body).filter(
      ([key, value]) =>
        typeof key === "string" &&
        key.length > 0 &&
        (typeof value === "string" || value === null)
    )
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Aucun parametre fourni" },
        { status: 400 }
      )
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value === null ? "" : String(value), updatedBy: session.user.id },
          update: { value: value === null ? "" : String(value), updatedBy: session.user.id },
        })
      )
    )

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Setting",
        entityId: null,
        description: `Parametres mis a jour : ${entries.map(([k]) => k).join(", ")}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/parametres POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
