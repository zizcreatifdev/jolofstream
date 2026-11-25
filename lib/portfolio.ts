export const PORTFOLIO_TYPES = {
  streaming_live: {
    label: "Streaming Live",
    color: "bg-red-100 text-red-700",
    publicLabel: "Streaming live",
    slug: "live",
  },
  ceo_content: {
    label: "CEO Content",
    color: "bg-blue-100 text-blue-700",
    publicLabel: "CEO Content",
    slug: "ceo",
  },
  creator_weekend: {
    label: "Creator Weekend",
    color: "bg-purple-100 text-purple-700",
    publicLabel: "Creator Weekend",
    slug: "creator",
  },
  formations: {
    label: "Formations",
    color: "bg-emerald-100 text-emerald-700",
    publicLabel: "Formations",
    slug: "formation",
  },
} as const

export type PortfolioType = keyof typeof PORTFOLIO_TYPES

export const PORTFOLIO_TYPE_KEYS = Object.keys(
  PORTFOLIO_TYPES
) as PortfolioType[]

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

// Identifiant YouTube (11 caracteres) depuis youtube.com/watch?v=, youtu.be/,
// /shorts/, /embed/ et /live/. Renvoie null pour tout autre lien.
export function extractYoutubeId(url: string): string | null {
  try {
    const raw = url.trim()
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = parsed.hostname.toLowerCase()
    let candidate: string | null = null
    if (host === "youtu.be" || host === "www.youtu.be") {
      candidate = parsed.pathname.split("/")[1] ?? null
    } else if (YOUTUBE_HOSTS.has(host)) {
      if (parsed.pathname === "/watch") {
        candidate = parsed.searchParams.get("v")
      } else {
        const match = parsed.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/)
        if (match) candidate = match[2]
      }
    }
    return candidate && YOUTUBE_ID_RE.test(candidate) ? candidate : null
  } catch {
    return null
  }
}

export function youtubeThumbnail(url: string): string | null {
  const id = extractYoutubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export function youtubeThumbnailHq(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeThumbnailMax(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}
