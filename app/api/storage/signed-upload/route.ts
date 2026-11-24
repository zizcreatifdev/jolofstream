import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import {
  UPLOAD_BUCKETS,
  UPLOAD_RULES,
  bucketLimits,
  uploadRule,
  type UploadBucket,
  type UploadTarget,
} from "@/lib/storage-buckets"

export const dynamic = "force-dynamic"

// Televersement direct navigateur vers Supabase Storage : une route Vercel
// refuse les corps de plus de 4,5 Mo. La route valide le fichier annonce
// (bucket en liste blanche, type et poids selon le bucket) et renvoie une
// URL signee d'upload.
const schema = z.object({
  bucket: z.enum(UPLOAD_BUCKETS as [UploadBucket, ...UploadBucket[]]).default("hero"),
  kind: z.string().min(1),
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
async function ensureBucket(bucket: UploadBucket): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.getBucket(bucket)
  if (data) return null
  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    ...bucketLimits(bucket),
  })
  return error && !/already exists/i.test(error.message) ? error.message : null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const { bucket, kind, fileName, contentType, size } = schema.parse(await req.json())
    if (!(kind in UPLOAD_RULES[bucket])) {
      return NextResponse.json(
        { error: `Type de fichier inconnu pour le bucket "${bucket}".` },
        { status: 400 }
      )
    }
    const rule = uploadRule({ bucket, kind } as UploadTarget)

    if (!rule.types.includes(contentType)) {
      return NextResponse.json(
        { error: `Format non accepte (${contentType || "inconnu"}). Attendu : ${rule.label}.` },
        { status: 400 }
      )
    }
    if (size > rule.maxBytes) {
      return NextResponse.json(
        {
          error: `Fichier trop lourd : ${size < 1024 * 1024 ? `${Math.ceil(size / 1024)} Ko` : `${(size / 1024 / 1024).toFixed(1)} Mo`}. Attendu : ${rule.label}.`,
        },
        { status: 400 }
      )
    }

    const bucketError = await ensureBucket(bucket)
    if (bucketError) {
      console.error("[api/storage/signed-upload] bucket", bucketError)
      return NextResponse.json(
        { error: `Bucket "${bucket}" indisponible : ${bucketError}` },
        { status: 500 }
      )
    }

    const ext = sanitizeFilename(fileName.split(".").pop() ?? "bin")
    const base = sanitizeFilename(fileName.replace(/\.[^.]+$/, "")) || "media"
    const folder =
      bucket === "hero"
        ? kind === "video"
          ? "videos"
          : "posters"
        : bucket === "formations"
          ? "plaquettes"
          : "images"
    const path = `${folder}/${Date.now()}-${base}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path)
    if (error || !data) {
      console.error("[api/storage/signed-upload]", error)
      return NextResponse.json(
        { error: error?.message || "URL d'upload indisponible" },
        { status: 500 }
      )
    }
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({
      bucket,
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
