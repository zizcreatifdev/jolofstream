import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

// Jeton opaque des liens de campagne (suivi d'ouverture, de clic, désabonnement).
// L'email du contact est chiffré (AES-256-GCM, clé dérivée de NEXTAUTH_SECRET) :
// il n'apparaît plus en clair ni en base64 dans les URL, et le jeton ne peut
// pas être fabriqué pour une autre adresse.

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant")
  return createHash("sha256").update(`marketing-token:${secret}`).digest()
}

export function encodeContactToken(email: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(email.toLowerCase().trim(), "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url")
}

export function decodeContactToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url")
    if (raw.length < 29) return null
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    const email = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")
    return email.includes("@") ? email : null
  } catch {
    return null
  }
}

// Liens envoyés avant le jeton chiffré (paramètre email en base64) : encore
// acceptés pour ne pas casser les emails déjà reçus.
function decodeLegacyEmail(value: string): string | null {
  try {
    const email = Buffer.from(value, "base64").toString("utf-8").toLowerCase().trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
  } catch {
    return null
  }
}

export function contactEmailFromParams(params: URLSearchParams): string | null {
  const t = params.get("t")
  if (t) return decodeContactToken(t)
  const legacy = params.get("email")
  return legacy ? decodeLegacyEmail(legacy) : null
}
