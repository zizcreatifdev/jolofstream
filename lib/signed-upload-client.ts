"use client"

// Envoi direct navigateur vers Supabase Storage par URL signée, avec
// progression (XMLHttpRequest). La signature passe par
// /api/storage/signed-upload (session, liste blanche, type et poids).

export type SignedUpload = { bucket: string; path: string; token: string; publicUrl: string }

export async function requestSignedUpload(input: {
  bucket: string
  kind: string
  fileName: string
  contentType: string
  size: number
  albumId?: string
}): Promise<SignedUpload> {
  const response = await fetch("/api/storage/signed-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.token) {
    throw new Error((data && typeof data.error === "string" && data.error) || "Téléversement impossible.")
  }
  return data as SignedUpload
}

// Même requête que supabase-js uploadToSignedUrl (PUT multipart), avec la
// progression d'envoi
export function putToSignedUrl(
  signed: SignedUpload,
  blob: Blob,
  onProgress?: (fraction: number) => void
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  const url = `${base}/storage/v1/object/upload/sign/${signed.bucket}/${signed.path}?token=${encodeURIComponent(signed.token)}`
  const body = new FormData()
  body.append("cacheControl", "31536000")
  body.append("", blob)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("apikey", anon)
    xhr.setRequestHeader("Authorization", `Bearer ${anon}`)
    xhr.setRequestHeader("x-upsert", "false")
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        let message = `Échec du téléversement (${xhr.status})`
        try {
          const json = JSON.parse(xhr.responseText)
          if (json?.message) message = `Échec du téléversement : ${json.message}`
        } catch {
          // réponse non JSON
        }
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant le téléversement."))
    xhr.send(body)
  })
}

// Signature puis envoi d'un fichier produit dans le navigateur
export async function uploadBlob(input: {
  bucket: string
  kind: string
  fileName: string
  blob: Blob
  contentType: string
  albumId?: string
  onProgress?: (fraction: number) => void
}): Promise<SignedUpload> {
  const signed = await requestSignedUpload({
    bucket: input.bucket,
    kind: input.kind,
    fileName: input.fileName,
    contentType: input.contentType,
    size: input.blob.size,
    albumId: input.albumId,
  })
  await putToSignedUrl(signed, input.blob, input.onProgress)
  return signed
}
