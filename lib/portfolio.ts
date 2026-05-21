export const PORTFOLIO_TYPES = {
  streaming_live: {
    label: "Streaming Live",
    color: "bg-red-100 text-red-700",
    publicLabel: "Streaming Live",
  },
  ceo_content: {
    label: "CEO Content",
    color: "bg-blue-100 text-blue-700",
    publicLabel: "CEO Content",
  },
  creator_weekend: {
    label: "Creator Weekend",
    color: "bg-purple-100 text-purple-700",
    publicLabel: "Creator Weekend",
  },
  formations: {
    label: "Formations",
    color: "bg-emerald-100 text-emerald-700",
    publicLabel: "Formations",
  },
} as const

export type PortfolioType = keyof typeof PORTFOLIO_TYPES

export const PORTFOLIO_TYPE_KEYS = Object.keys(
  PORTFOLIO_TYPES
) as PortfolioType[]

export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null
    }
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")
      }
      const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/?]+)/)
      if (match) return match[2]
    }
    return null
  } catch {
    return null
  }
}

export function youtubeThumbnail(url: string): string | null {
  const id = extractYoutubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}
