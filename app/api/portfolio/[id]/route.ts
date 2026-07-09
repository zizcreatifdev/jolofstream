import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/portfolio/"

async function removeStoredPhoto(mediaUrl: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return
  const prefix = `${supabaseUrl}${STORAGE_PUBLIC_PREFIX}`
  if (!mediaUrl.startsWith(prefix)) return
  const path = mediaUrl.slice(prefix.length)
  if (!path) return
  const { error } = await supabaseAdmin.storage
    .from("portfolio")
    .remove([path])
  if (error) {
    console.warn("[api/portfolio DELETE storage cleanup]", error.message)
  }
}

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  type: z
    .enum(["streaming_live", "ceo_content", "creator_weekend", "formations"])
    .optional(),
  date: z.string().optional().or(z.literal("")).nullable(),
  description: z.string().optional().or(z.literal("")).nullable(),
  mediaType: z.enum(["photo", "youtube"]).optional(),
  mediaUrl: z.string().trim().url().optional(),
  thumbnailUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .nullable(),
  published: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.type !== undefined) updateData.type = data.type
    if (data.date !== undefined) {
      updateData.date = data.date ? new Date(data.date) : null
    }
    if (data.description !== undefined)
      updateData.description = data.description || null
    if (data.mediaType !== undefined) updateData.mediaType = data.mediaType
    if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl
    if (data.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = data.thumbnailUrl || null
    }
    if (data.published !== undefined) updateData.published = data.published
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder

    const item = await prisma.portfolioItem.update({
      where: { id: params.id },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "PortfolioItem",
        entityId: item.id,
        description: `Realisation modifiee : ${item.title}`,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/portfolio/:id PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const item = await prisma.portfolioItem.findUnique({
      where: { id: params.id },
    })
    if (!item) {
      return NextResponse.json(
        { error: "Realisation introuvable" },
        { status: 404 }
      )
    }

    if (item.mediaType === "photo" && item.mediaUrl) {
      try {
        await removeStoredPhoto(item.mediaUrl)
      } catch (e) {
        console.warn("[api/portfolio DELETE storage cleanup]", e)
      }
    }

    await prisma.portfolioItem.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "PortfolioItem",
        entityId: params.id,
        description: `Realisation supprimee : ${item.title}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api/portfolio/:id DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
