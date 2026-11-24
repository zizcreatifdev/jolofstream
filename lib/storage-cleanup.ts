import { supabaseAdmin } from "@/lib/supabase"
import { bucketStoragePath, type UploadBucket } from "@/lib/storage-buckets"

// Supprime du bucket les fichiers references avant une modification et plus
// references apres (fichier remplace ou retire). Best effort : un echec est
// journalise sans bloquer l'enregistrement.
export async function removeReplacedFiles(
  bucket: UploadBucket,
  before: Array<string | null | undefined>,
  after: Array<string | null | undefined>
): Promise<void> {
  const kept = new Set(after.filter(Boolean))
  const paths = before
    .filter((url): url is string => Boolean(url) && !kept.has(url))
    .map((url) => bucketStoragePath(bucket, url))
    .filter((p): p is string => Boolean(p))
  if (paths.length === 0) return
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove(paths)
    if (error) console.warn(`[storage-cleanup] ${bucket}`, error)
  } catch (error) {
    console.warn(`[storage-cleanup] ${bucket}`, error)
  }
}
