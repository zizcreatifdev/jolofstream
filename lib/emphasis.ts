// Syntaxe de mise en avant : *mots* en italique, **mots** en rouge
export type EmphasisStyle = "plain" | "em" | "strong"
export type EmphasisSegment = { text: string; style: EmphasisStyle }

export function parseEmphasis(text: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = []
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), style: "plain" })
    }
    segments.push(
      match[1] !== undefined
        ? { text: match[1], style: "strong" }
        : { text: match[2], style: "em" }
    )
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last), style: "plain" })
  return segments
}

// Mots individuels avec leur style (eclairage mot par mot du manifeste)
export function emphasisWords(text: string): EmphasisSegment[] {
  return parseEmphasis(text).flatMap((segment) =>
    segment.text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ text: word, style: segment.style }))
  )
}
