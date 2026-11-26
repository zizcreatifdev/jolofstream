import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateSite } from "@/lib/revalidate-site"
import { formatBytes } from "@/lib/image-profiles"
import { analyzeImages, optimizeImages } from "@/lib/image-optimize-server"

export const dynamic = "force-dynamic"
// Un lot de 5 images : téléchargement, sharp, envoi
export const maxDuration = 60

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("analyze") }),
  z.object({ action: z.literal("optimize"), ids: z.array(z.string().min(1).max(200)).min(1).max(5) }),
  z.object({
    action: z.literal("finish"),
    optimized: z.number().int().min(0).max(10000),
    failed: z.number().int().min(0).max(10000),
    gainBytes: z.number().int().min(0),
  }),
])

// Pages publiques qui affichent ces images
const PATHS = ["/", "/services", "/formations", "/portfolio", "/galerie", "/a-propos", "/contact"]

// Paramètres > Maintenance > Optimiser les images existantes (admins)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== "admin") return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  const body = parsed.data
  try {
    if (body.action === "analyze") {
      const { items, errors } = await analyzeImages()
      return NextResponse.json({
        items,
        errors,
        totalSize: items.reduce((a, i) => a + i.size, 0),
        totalEstimated: items.reduce((a, i) => a + i.estimated, 0),
      })
    }
    if (body.action === "optimize") {
      const results = await optimizeImages(body.ids)
      if (results.some((r) => r.ok)) revalidateSite(PATHS)
      return NextResponse.json({ results })
    }
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Setting",
        entityId: "maintenance-images",
        description: `Images optimisées : ${body.optimized}, gain ${formatBytes(body.gainBytes)}${body.failed ? `, ${body.failed} ignorée${body.failed > 1 ? "s" : ""} (erreur)` : ""}`,
      },
    })
    revalidateSite(PATHS)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/maintenance/images]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
