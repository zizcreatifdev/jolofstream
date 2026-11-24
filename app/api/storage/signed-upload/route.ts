import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { HERO_BUCKET, HERO_MEDIA } from "@/lib/hero-slides"

export const dynamic = "force-dynamic"

// Televersement direct navigateur vers Supabase Storage : une route Vercel
// refuse les corps de plus de 4,5 Mo, une video du hero peut faire 15 Mo.
// La route valide le fichier annonce et renvoie une URL signee d'upload.
const schema = z.object({
  kind: z.enum(["video", "poster"]),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1),
  size: z.number().int().positive(),
})

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

// Cree le bucket public au premier usage s'il n'existe pas encore
async function ensureHeroBucket(): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.getBucket(HERO_BUCKET)
  if (data) return null
  const { error } = await supabaseAdmin.storage.createBucket(HERO_BUCKET, {
    public: true,
    fileSizeLimit: HERO_MEDIA.video.maxBytes,
    allowedMimeTypes: [...HERO_MEDIA.video.types, ...HERO_MEDIA.poster.types],
  })
  return error && !/already exists/i.test(error.message) ? error.message : null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const { kind, fileName, contentType, size } = schema.parse(await req.json())
    const rules = HERO_MEDIA[kind]

    if (!(rules.types as readonly string[]).includes(contentType)) {
      return NextResponse.json(
        { error: `Format non accepte (${contentType || "inconnu"}). Attendu : ${rules.label}.` },
        { status: 400 }
      )
    }
    if (size > rules.maxBytes) {
      return NextResponse.json(
        {
          error: `Fichier trop lourd : ${(size / 1024 / 1024).toFixed(1)} Mo. Attendu : ${rules.label}.`,
        },
        { status: 400 }
      )
    }

    const bucketError = await ensureHeroBucket()
    if (bucketError) {
      console.error("[api/storage/signed-upload] bucket", bucketError)
      return NextResponse.json(
        { error: `Bucket "${HERO_BUCKET}" indisponible : ${bucketError}` },
        { status: 500 }
      )
    }

    const ext = sanitizeFilename(fileName.split(".").pop() ?? "bin")
    const base = sanitizeFilename(fileName.replace(/\.[^.]+$/, "")) || "media"
    const path = `${kind === "video" ? "videos" : "posters"}/${Date.now()}-${base}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(HERO_BUCKET)
      .createSignedUploadUrl(path)
    if (error || !data) {
      console.error("[api/storage/signed-upload]", error)
      return NextResponse.json(
        { error: error?.message || "URL d'upload indisponible" },
        { status: 500 }
      )
    }
    const { data: urlData } = supabaseAdmin.storage
      .from(HERO_BUCKET)
      .getPublicUrl(data.path)

    return NextResponse.json({
      bucket: HERO_BUCKET,
      path: data.path,
      token: data.token,
      publicUrl: urlData.publicUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/storage/signed-upload]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
