import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PARAM_KEYS, PUBLIC_PARAM_KEYS } from "@/lib/parametres"

const VALID_PARAM_KEYS = new Set<string>(Object.values(PARAM_KEYS))

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const isAdmin = Boolean(session?.user)

  try {
    const { searchParams } = new URL(req.url)
    const keysParam = searchParams.get("keys")
    const requestedKeys = keysParam
      ? keysParam.split(",").map((s) => s.trim()).filter(Boolean)
      : null

    let allowedKeys: string[] | null = null
    if (!isAdmin) {
      const publicRequested = requestedKeys
        ? requestedKeys.filter((k) => PUBLIC_PARAM_KEYS.has(k))
        : Array.from(PUBLIC_PARAM_KEYS)
      allowedKeys = publicRequested
    } else if (requestedKeys) {
      allowedKeys = requestedKeys
    }

    const where = allowedKeys ? { key: { in: allowedKeys } } : undefined

    const settings = await prisma.setting.findMany({ where })
    const result: Record<string, string> = {}
    for (const s of settings) {
      if (!isAdmin && !PUBLIC_PARAM_KEYS.has(s.key)) continue
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

    const invalidKeys = entries
      .map(([key]) => key)
      .filter((key) => !VALID_PARAM_KEYS.has(key))
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          error: "Cle(s) invalide(s)",
          invalidKeys,
          detail: `Les cles suivantes ne sont pas autorisees : ${invalidKeys.join(", ")}. Verifiez PARAM_KEYS dans lib/parametres.ts.`,
        },
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
