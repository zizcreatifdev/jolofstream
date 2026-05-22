import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { IMPORT_MAX_ROWS } from "@/lib/marketing"

const importItemSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  lists: z.array(z.string()).optional(),
})

const bodySchema = z.object({
  contacts: z.array(z.unknown()),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = bodySchema.parse(body)
    const rows = parsed.contacts

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Aucun contact a importer" },
        { status: 400 }
      )
    }
    if (rows.length > IMPORT_MAX_ROWS) {
      return NextResponse.json(
        {
          error: `Maximum ${IMPORT_MAX_ROWS} contacts par import (${rows.length} fournis).`,
        },
        { status: 400 }
      )
    }

    let importes = 0
    let misAJour = 0
    let erreurs = 0
    const details: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const result = importItemSchema.safeParse(rows[i])
      if (!result.success) {
        erreurs += 1
        details.push(
          `Ligne ${i + 1} : ${
            result.error.issues[0]?.message ?? "donnees invalides"
          }`
        )
        continue
      }
      const item = result.data
      const normalized = item.email.toLowerCase().trim()
      const lists = (item.lists ?? []).filter(
        (l) => typeof l === "string" && l.trim().length > 0
      )

      try {
        const existing = await prisma.marketingContact.findUnique({
          where: { email: normalized },
          select: { id: true, lists: true },
        })
        if (existing) {
          const mergedLists = Array.from(
            new Set([...(existing.lists ?? []), ...lists])
          )
          await prisma.marketingContact.update({
            where: { id: existing.id },
            data: {
              firstName: item.firstName?.trim() || undefined,
              lastName: item.lastName?.trim() || undefined,
              lists: mergedLists,
            },
          })
          misAJour += 1
        } else {
          await prisma.marketingContact.create({
            data: {
              email: normalized,
              firstName: item.firstName?.trim() || null,
              lastName: item.lastName?.trim() || null,
              lists,
            },
          })
          importes += 1
        }
      } catch (e) {
        erreurs += 1
        details.push(
          `Ligne ${i + 1} (${normalized}) : ${
            e instanceof Error ? e.message : "erreur d'enregistrement"
          }`
        )
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "MarketingContact",
        entityId: "import",
        description: `Import CSV : ${importes} importes, ${misAJour} mis a jour, ${erreurs} erreurs`,
      },
    })

    return NextResponse.json({
      importes,
      mis_a_jour: misAJour,
      erreurs,
      details: details.slice(0, 20),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Format invalide", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/marketing/contacts/import]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
