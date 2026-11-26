import sharp from "sharp"

import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { bucketStoragePath } from "@/lib/storage-buckets"
import {
  IMAGE_PROFILES,
  MAX_SCALE_PASSES,
  QUALITY_STEPS,
  SCALE_STEP,
  type ImageProfileName,
} from "@/lib/image-profiles"

// Rattrapage des images déjà en ligne (Paramètres > Maintenance) : inventaire
// des images référencées en base, analyse (simulation) et optimisation avec
// sharp selon les mêmes profils que la compression navigateur.

type Bucket = "hero" | "site" | "equipe" | "avatars" | "portfolio" | "signatures"

// Une référence d'image : où elle est stockée en base et comment la remplacer
export type ImageRef = {
  id: string
  location: string
  profile: ImageProfileName
  bucket: Bucket
  url: string
  // Mise à jour de la référence (conditionnelle : échoue si la valeur a changé)
  replace: (newUrl: string, newPath: string) => Promise<boolean>
}

export type AnalyzedImage = {
  id: string
  location: string
  profile: ImageProfileName
  profileLabel: string
  url: string
  size: number
  estimated: number
}

// Remplace toutes les occurrences exactes d'une chaîne dans un JSON
function replaceDeep(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") return value === from ? to : value
  if (Array.isArray(value)) return value.map((v) => replaceDeep(v, from, to))
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v, from, to)]))
  }
  return value
}

// Remplacement dans un réglage JSON, seulement s'il n'a pas changé depuis la lecture
function settingJsonReplace(key: string, oldUrl: string, oldPath?: string) {
  return async (newUrl: string, newPath: string) => {
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (!setting?.value.includes(oldUrl)) return false
    let parsed = replaceDeep(JSON.parse(setting.value), oldUrl, newUrl)
    if (oldPath) parsed = replaceDeep(parsed, oldPath, newPath)
    const updated = await prisma.setting.updateMany({
      where: { key, value: setting.value },
      data: { value: JSON.stringify(parsed) },
    })
    return updated.count === 1
  }
}

function safeJson(value: string | null | undefined): unknown {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function inBucket(bucket: Bucket, url: string | null | undefined): url is string {
  return Boolean(url) && bucketStoragePath(bucket, url as string) !== null
}

// Inventaire de toutes les images référencées dans les emplacements traités
export async function collectImageRefs(): Promise<ImageRef[]> {
  const refs: ImageRef[] = []
  const [slides, testimonials, users, items, settings] = await Promise.all([
    prisma.heroSlide.findMany({ select: { id: true, order: true, titleLine1: true, posterUrl: true } }),
    prisma.testimonial.findMany({ select: { id: true, authorName: true, photoUrl: true } }),
    prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, avatarUrl: true } }),
    prisma.portfolioItem.findMany({ select: { id: true, title: true, mediaType: true, mediaUrl: true, thumbnailUrl: true } }),
    prisma.setting.findMany({
      where: { key: { in: ["home_skills", "about_team", "about_hero_image", "page_heroes", "pdf_signature_url"] } },
    }),
  ])

  for (const s of slides) {
    if (!inBucket("hero", s.posterUrl)) continue
    const oldUrl = s.posterUrl
    refs.push({
      id: `hero:${s.id}`,
      location: `Hero, slide ${s.order + 1} (${s.titleLine1})`,
      profile: "hero-poster",
      bucket: "hero",
      url: oldUrl,
      replace: async (newUrl) =>
        (await prisma.heroSlide.updateMany({ where: { id: s.id, posterUrl: oldUrl }, data: { posterUrl: newUrl } })).count === 1,
    })
  }
  for (const t of testimonials) {
    if (!inBucket("site", t.photoUrl)) continue
    const oldUrl = t.photoUrl
    refs.push({
      id: `temoignage:${t.id}`,
      location: `Témoignage de ${t.authorName}`,
      profile: "portrait",
      bucket: "site",
      url: oldUrl,
      replace: async (newUrl) =>
        (await prisma.testimonial.updateMany({ where: { id: t.id, photoUrl: oldUrl }, data: { photoUrl: newUrl } })).count === 1,
    })
  }
  for (const u of users) {
    if (!inBucket("avatars", u.avatarUrl)) continue
    const oldUrl = u.avatarUrl
    refs.push({
      id: `avatar:${u.id}`,
      location: `Avatar de ${u.firstName} ${u.lastName}`.trim(),
      profile: "avatar",
      bucket: "avatars",
      url: oldUrl,
      replace: async (newUrl) =>
        (await prisma.user.updateMany({ where: { id: u.id, avatarUrl: oldUrl }, data: { avatarUrl: newUrl } })).count === 1,
    })
  }
  for (const p of items) {
    if (p.mediaType === "photo" && inBucket("portfolio", p.mediaUrl)) {
      const oldUrl = p.mediaUrl
      refs.push({
        id: `portfolio:${p.id}:photo`,
        location: `Portfolio, photo de « ${p.title} »`,
        profile: "portfolio-large",
        bucket: "portfolio",
        url: oldUrl,
        replace: async (newUrl) =>
          (await prisma.portfolioItem.updateMany({ where: { id: p.id, mediaUrl: oldUrl }, data: { mediaUrl: newUrl } })).count === 1,
      })
    }
    if (inBucket("portfolio", p.thumbnailUrl)) {
      const oldUrl = p.thumbnailUrl
      refs.push({
        id: `portfolio:${p.id}:miniature`,
        location: `Portfolio, miniature de « ${p.title} »`,
        profile: "portfolio-thumb",
        bucket: "portfolio",
        url: oldUrl,
        replace: async (newUrl) =>
          (await prisma.portfolioItem.updateMany({ where: { id: p.id, thumbnailUrl: oldUrl }, data: { thumbnailUrl: newUrl } })).count === 1,
      })
    }
  }

  const byKey = new Map(settings.map((s) => [s.key, s.value]))
  const skills = safeJson(byKey.get("home_skills")) as { items?: Array<{ title?: string; imageUrl?: string | null }> } | null
  skills?.items?.forEach((item, i) => {
    if (!inBucket("site", item.imageUrl)) return
    refs.push({
      id: `savoir-faire:${i}`,
      location: `Savoir-faire ${i + 1} (${item.title ?? ""})`,
      profile: "skill",
      bucket: "site",
      url: item.imageUrl,
      replace: settingJsonReplace("home_skills", item.imageUrl),
    })
  })
  const team = safeJson(byKey.get("about_team")) as Array<{ firstName?: string; lastName?: string; avatarUrl?: string }> | null
  if (Array.isArray(team)) {
    team.forEach((m, i) => {
      if (!inBucket("equipe", m.avatarUrl)) return
      refs.push({
        id: `equipe:${i}`,
        location: `Équipe, photo de ${[m.firstName, m.lastName].filter(Boolean).join(" ") || `membre ${i + 1}`}`,
        profile: "portrait",
        bucket: "equipe",
        url: m.avatarUrl,
        replace: settingJsonReplace("about_team", m.avatarUrl),
      })
    })
  }
  const aboutImage = byKey.get("about_hero_image")
  if (inBucket("equipe", aboutImage)) {
    refs.push({
      id: "a-propos:image",
      location: "À propos, image principale",
      profile: "wide",
      bucket: "equipe",
      url: aboutImage,
      replace: async (newUrl) =>
        (await prisma.setting.updateMany({ where: { key: "about_hero_image", value: aboutImage }, data: { value: newUrl } })).count === 1,
    })
  }
  const heroes = safeJson(byKey.get("page_heroes")) as Record<string, { imageUrl?: string; imagePath?: string }> | null
  if (heroes && typeof heroes === "object") {
    for (const [page, hero] of Object.entries(heroes)) {
      if (!hero?.imagePath || !inBucket("hero", hero.imageUrl)) continue
      refs.push({
        id: `entete:${page}`,
        location: `En-tête de la page ${page}`,
        profile: "page-hero",
        bucket: "hero",
        url: hero.imageUrl,
        replace: settingJsonReplace("page_heroes", hero.imageUrl, hero.imagePath),
      })
    }
  }
  // Signature : reprise dans le PDF de contrat, reste en PNG
  const signature = byKey.get("pdf_signature_url")
  if (inBucket("signatures", signature)) {
    refs.push({
      id: "signature",
      location: "Signature et tampon (PDF)",
      profile: "signature",
      bucket: "signatures",
      url: signature,
      replace: async (newUrl) =>
        (await prisma.setting.updateMany({ where: { key: "pdf_signature_url", value: signature }, data: { value: newUrl } })).count === 1,
    })
  }
  return refs
}

async function remoteSize(url: string): Promise<number | null> {
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" })
    const length = Number(head.headers.get("content-length"))
    if (head.ok && length > 0) return length
  } catch {
    // repli sur GET
  }
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.arrayBuffer()).byteLength
  } catch {
    return null
  }
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

// Même algorithme que le navigateur : qualité 0,82, 0,74, 0,66, puis
// dimensions réduites de 15 % par passe ; orientation EXIF appliquée,
// métadonnées supprimées (comportement par défaut de sharp)
export async function optimizeBuffer(input: Buffer, name: ImageProfileName): Promise<{ data: Buffer; format: "webp" | "png" }> {
  const profile = IMAGE_PROFILES[name]
  const meta = await sharp(input).metadata()
  if ((meta.pages ?? 1) > 1) throw new Error("Image animée ignorée")
  const rotated = await sharp(input).rotate().toBuffer({ resolveWithObject: true })
  let maxSide = Math.min(profile.maxSide, Math.max(rotated.info.width, rotated.info.height))
  let smallest: Buffer | null = null
  const qualities = profile.format === "png" ? [1] : QUALITY_STEPS
  for (let pass = 0; pass < MAX_SCALE_PASSES; pass++) {
    for (const q of qualities) {
      const pipeline = sharp(rotated.data).resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      const data =
        profile.format === "png"
          ? await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
          : await pipeline.webp({ quality: Math.round(q * 100) }).toBuffer()
      if (data.length <= profile.targetBytes) return { data, format: profile.format }
      if (!smallest || data.length < smallest.length) smallest = data
    }
    maxSide = Math.round(maxSide * SCALE_STEP)
    if (maxSide < 160) break
  }
  if (smallest && smallest.length <= profile.limitBytes) return { data: smallest, format: profile.format }
  throw new Error("Compression impossible sous la limite du bucket")
}

// Simulation : images au-dessus de la cible de leur profil, avec le poids
// obtenu après traitement (calculé réellement, rien n'est écrit)
export async function analyzeImages(): Promise<{ items: AnalyzedImage[]; errors: Array<{ location: string; error: string }> }> {
  const refs = await collectImageRefs()
  const items: AnalyzedImage[] = []
  const errors: Array<{ location: string; error: string }> = []
  for (let i = 0; i < refs.length; i += 5) {
    await Promise.all(
      refs.slice(i, i + 5).map(async (ref) => {
        const profile = IMAGE_PROFILES[ref.profile]
        const size = await remoteSize(ref.url)
        if (size === null) {
          errors.push({ location: ref.location, error: "Fichier introuvable dans le stockage" })
          return
        }
        if (size <= profile.targetBytes) return
        try {
          const { data } = await optimizeBuffer(await download(ref.url), ref.profile)
          if (data.length >= size) return
          items.push({ id: ref.id, location: ref.location, profile: ref.profile, profileLabel: profile.label, url: ref.url, size, estimated: data.length })
        } catch (error) {
          errors.push({ location: ref.location, error: error instanceof Error ? error.message : "Analyse impossible" })
        }
      })
    )
  }
  items.sort((a, b) => b.size - b.estimated - (a.size - a.estimated))
  return { items, errors }
}

export type OptimizeResult = { id: string; location: string; ok: boolean; before?: number; after?: number; error?: string }

// Optimisation d'un lot (5 au plus) : nouveau fichier, mise à jour de la
// référence, puis suppression de l'ancien fichier seulement après succès et
// s'il n'est plus référencé ailleurs. Traitement l'un après l'autre : plusieurs
// images d'un même réglage JSON (savoir-faire, équipe) se mettent à jour sans
// conflit.
export async function optimizeImages(ids: string[]): Promise<OptimizeResult[]> {
  const refs = await collectImageRefs()
  const byId = new Map(refs.map((r) => [r.id, r]))
  const results: OptimizeResult[] = []
  for (const id of ids.slice(0, 5)) {
    const ref = byId.get(id)
    if (!ref) {
      results.push({ id, location: id, ok: false, error: "Image introuvable (modifiée entre-temps)" })
      continue
    }
    const oldPath = bucketStoragePath(ref.bucket, ref.url) as string
    let newPath: string | null = null
    try {
      const original = await download(ref.url)
      const { data, format } = await optimizeBuffer(original, ref.profile)
      if (data.length >= original.length) {
        results.push({ id, location: ref.location, ok: false, error: "Déjà optimisée" })
        continue
      }
      const folder = oldPath.includes("/") ? oldPath.slice(0, oldPath.lastIndexOf("/") + 1) : ""
      const base = oldPath.slice(folder.length).replace(/\.[^.]+$/, "").replace(/-opt-\d+$/, "").slice(0, 60) || "image"
      newPath = `${folder}${base}-opt-${Date.now()}.${format}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from(ref.bucket)
        .upload(newPath, data, { contentType: `image/${format}`, cacheControl: "31536000", upsert: false })
      if (uploadError) throw new Error(`Envoi du nouveau fichier impossible : ${uploadError.message}`)
      const { data: pub } = supabaseAdmin.storage.from(ref.bucket).getPublicUrl(newPath)
      const updated = await ref.replace(pub.publicUrl, newPath)
      if (!updated) throw new Error("Référence modifiée entre-temps : rien n'a été changé")
      // Ancien fichier supprimé seulement s'il n'est plus référencé nulle part
      const stillUsed = (await collectImageRefs()).some((r) => r.url === ref.url)
      if (!stillUsed) await supabaseAdmin.storage.from(ref.bucket).remove([oldPath])
      newPath = null
      results.push({ id, location: ref.location, ok: true, before: original.length, after: data.length })
    } catch (error) {
      // Échec : le nouveau fichier éventuellement envoyé est retiré
      if (newPath) await supabaseAdmin.storage.from(ref.bucket).remove([newPath]).catch(() => null)
      results.push({ id, location: ref.location, ok: false, error: error instanceof Error ? error.message : "Optimisation impossible" })
    }
  }
  return results
}
