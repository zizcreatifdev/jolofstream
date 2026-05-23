import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

const ALLOWED_BUCKETS = ["avatars", "signatures", "portfolio", "equipe"] as const

const schema = z.object({
  bucket: z.enum(ALLOWED_BUCKETS),
  path: z.string().min(1, "Path requis"),
})

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { bucket, path } = schema.parse(body)

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path])
    if (error) {
      console.warn("[api/storage/delete]", error)
      return NextResponse.json(
        { error: error.message ?? "Echec de la suppression" },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/storage/delete]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
