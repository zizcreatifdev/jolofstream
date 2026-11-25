import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { GALLERY_BUCKET, GALLERY_PATHS } from "@/lib/gallery"
import { revalidateSite } from "@/lib/revalidate-site"

// Fonctions serveur de la galerie (admin et API)

// Supprime les fichiers (grande taille et miniature) du bucket galerie.
// Best effort : un échec est journalisé sans bloquer la suppression en base.
export async function removeGalleryFiles(photos: Array<{ path: string; thumbPath: string }>): Promise<void> {
  const paths = photos.flatMap((p) => [p.path, p.thumbPath]).filter(Boolean)
  for (let i = 0; i < paths.length; i += 100) {
    try {
      const { error } = await supabaseAdmin.storage.from(GALLERY_BUCKET).remove(paths.slice(i, i + 100))
      if (error) console.warn("[galerie] suppression fichiers", error)
    } catch (error) {
      console.warn("[galerie] suppression fichiers", error)
    }
  }
}

// Pages publiques à régénérer après une modification d'album
export function revalidateAlbum(album: { slug: string; programId?: string | null }, previousSlug?: string): void {
  // Sitemap compris : un album publié, renommé ou supprimé y est à jour
  const paths = [...GALLERY_PATHS, `/galerie/${album.slug}`, "/sitemap.xml"]
  if (previousSlug && previousSlug !== album.slug) paths.push(`/galerie/${previousSlug}`)
  if (album.programId) paths.push("/formations")
  revalidateSite(paths)
}

export async function logGallery(userId: string, action: string, entityId: string, description: string) {
  await prisma.activityLog.create({
    data: { userId, action, entityType: "GalleryAlbum", entityId, description },
  })
}

// Slug libre : ajoute -2, -3... si déjà pris par un autre album
export async function uniqueAlbumSlug(base: string, exceptId?: string): Promise<string> {
  let slug = base
  for (let n = 2; n < 200; n++) {
    const found = await prisma.galleryAlbum.findUnique({ where: { slug }, select: { id: true } })
    if (!found || found.id === exceptId) return slug
    slug = `${base}-${n}`.slice(0, 80)
  }
  return `${base}-${Date.now()}`
}
