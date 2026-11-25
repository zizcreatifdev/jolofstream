// Limitation simple en memoire (par instance du serveur, au mieux) : N
// evenements par cle sur une fenetre glissante
const buckets = new Map<string, number[]>()

export function rateLimitHit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  buckets.set(key, recent)
  return recent.length >= limit
}

export function rateLimitRecord(key: string, now = Date.now()): void {
  const list = buckets.get(key) ?? []
  list.push(now)
  buckets.set(key, list)
  // Nettoyage occasionnel des cles inactives
  if (buckets.size > 5000) {
    buckets.forEach((times, k) => {
      if (!times.some((t) => now - t < 3_600_000)) buckets.delete(k)
    })
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "inconnue"
}
