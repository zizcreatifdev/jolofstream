import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const ALLOWED_BUCKETS = ["avatars", "signatures", "portfolio", "equipe"] as const
type Bucket = (typeof ALLOWED_BUCKETS)[number]

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

const MAX_SIZE_BYTES = 5 * 1024 * 1024

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const bucket = String(formData.get("bucket") ?? "")
    const path = String(formData.get("path") ?? "")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      )
    }
    if (!ALLOWED_BUCKETS.includes(bucket as Bucket)) {
      return NextResponse.json(
        { error: `Bucket invalide. Autorises : ${ALLOWED_BUCKETS.join(", ")}` },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Type de fichier non autorise : ${file.type}. Acceptes : JPG, PNG, WebP, GIF.`,
        },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Fichier trop volumineux : ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum 5 MB.`,
        },
        { status: 400 }
      )
    }

    const ext = sanitizeFilename(file.name.split(".").pop() ?? "bin")
    const baseName = sanitizeFilename(
      file.name.replace(/\.[^.]+$/, "") || "fichier"
    )
    const filename = `${Date.now()}-${baseName}.${ext}`
    const safePath = path.replace(/[^a-zA-Z0-9_/.-]+/g, "-")
    const fullPath = safePath ? `${safePath}/${filename}` : filename

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fullPath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      })

    if (error || !data) {
      console.error("[api/storage/upload]", error)
      return NextResponse.json(
        { error: error?.message || "Echec de l'upload" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
      bucket,
    })
  } catch (error) {
    console.error("[api/storage/upload]", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload" },
      { status: 500 }
    )
  }
}
