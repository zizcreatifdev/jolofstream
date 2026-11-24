// Badge du hero (cote serveur uniquement, hors du bundle du carrousel)

// Jeton du badge remplace cote serveur par la prochaine cohorte ouverte
// (« Cohorte 9 · 7 janv. ») ; sans cohorte ouverte, le badge est masque
export const NEXT_COHORT_TOKEN = "{prochaine-cohorte}"

export function applyBadgeToken(badge: string | null, nextCohort: string | null): string | null {
  if (!badge || !badge.includes(NEXT_COHORT_TOKEN)) return badge
  if (!nextCohort) return null
  return badge.split(NEXT_COHORT_TOKEN).join(nextCohort)
}
