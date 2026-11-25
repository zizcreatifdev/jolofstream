import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PARAM_KEYS, PUBLIC_PARAM_KEYS } from "@/lib/parametres"
import { PAYMENT_DELAY_MAX, PAYMENT_DELAY_MIN } from "@/lib/training-programs"

const VALID_PARAM_KEYS = new Set<string>(Object.values(PARAM_KEYS))

// Corps : { clé: texte | null }. La liste blanche des clés est vérifiée ensuite.
const bodySchema = z.record(z.string().min(1).max(100), z.string().max(100_000).nullable())

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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides : chaque paramètre doit être un texte (100 000 caractères maximum)." },
        { status: 400 }
      )
    }
    const entries = Object.entries(parsed.data)
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Aucun paramètre fourni" },
        { status: 400 }
      )
    }

    const invalidKeys = entries
      .map(([key]) => key)
      .filter((key) => !VALID_PARAM_KEYS.has(key))
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          error: "Clé(s) invalide(s)",
          invalidKeys,
          detail: `Les clés suivantes ne sont pas autorisées : ${invalidKeys.join(", ")}. Vérifiez PARAM_KEYS dans lib/parametres.ts.`,
        },
        { status: 400 }
      )
    }

    const delay = entries.find(([key]) => key === PARAM_KEYS.training_payment_delay_hours)
    if (delay) {
      const n = Number(delay[1])
      if (!Number.isInteger(n) || n < PAYMENT_DELAY_MIN || n > PAYMENT_DELAY_MAX) {
        return NextResponse.json(
          {
            error: `Le délai de paiement doit être un nombre entier d'heures entre ${PAYMENT_DELAY_MIN} et ${PAYMENT_DELAY_MAX}.`,
          },
          { status: 400 }
        )
      }
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
        description: `Paramètres mis à jour : ${entries.map(([k]) => k).join(", ")}`,
      },
    })

    // Pages publiques regenerees (coordonnees du pied de page, A propos,
    // documents legaux, delai de paiement des formations)
    try {
      revalidatePath("/", "layout")
    } catch {
      // hors contexte de rendu
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/parametres POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
