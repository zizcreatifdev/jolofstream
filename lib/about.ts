import { parseJsonField, type AboutStat, type AboutTeamMember, type AboutValue } from "@/lib/parametres"

// Lecture des parametres about_* : listes valides seulement, membres sans
// nom reel ecartes (ancien contenu fictif « Prenom Nom »)
const FAKE_FIRST = new Set(["prenom", "prénom"])
const FAKE_LAST = new Set(["nom"])

export function realTeam(raw: string | undefined): AboutTeamMember[] {
  const list = parseJsonField<unknown>(raw, [])
  if (!Array.isArray(list)) return []
  return list.filter((m): m is AboutTeamMember => {
    if (!m || typeof m !== "object") return false
    const first = String((m as AboutTeamMember).firstName ?? "").trim()
    const last = String((m as AboutTeamMember).lastName ?? "").trim()
    if (!first && !last) return false
    if (FAKE_FIRST.has(first.toLowerCase()) && (!last || FAKE_LAST.has(last.toLowerCase()))) return false
    return true
  })
}

export function aboutValues(raw: string | undefined): AboutValue[] {
  const list = parseJsonField<unknown>(raw, [])
  return Array.isArray(list)
    ? list.filter((v): v is AboutValue => Boolean(v && typeof v === "object" && String((v as AboutValue).title ?? "").trim()))
    : []
}

export function aboutStats(raw: string | undefined): AboutStat[] {
  const list = parseJsonField<unknown>(raw, [])
  return Array.isArray(list)
    ? list.filter((s): s is AboutStat => Boolean(s && typeof s === "object" && String((s as AboutStat).value ?? "").trim()))
    : []
}

// Paragraphes separes par une ligne vide (ou un retour a la ligne)
export function paragraphs(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
