// Mise en forme des documents legaux sans HTML : « ## » titre, ligne vide =
// paragraphe, « - » = liste. Le texte est toujours rendu comme du texte.
export type LegalBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }

export const DELAY_PAYMENT_TOKEN = "{delai_paiement}"

export function parseLegalText(source: string, delayLabel?: string): LegalBlock[] {
  const text = delayLabel ? source.split(DELAY_PAYMENT_TOKEN).join(delayLabel) : source
  const blocks: LegalBlock[] = []
  let paragraph: string[] = []
  let list: string[] | null = null
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") })
    paragraph = []
  }
  const flushList = () => {
    if (list && list.length) blocks.push({ type: "list", items: list })
    list = null
  }
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
    } else if (line.startsWith("## ")) {
      flushParagraph()
      flushList()
      blocks.push({ type: "heading", text: line.slice(3).trim() })
    } else if (line.startsWith("- ")) {
      flushParagraph()
      list = list ?? []
      list.push(line.slice(2).trim())
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}
