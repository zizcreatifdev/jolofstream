import { getPublicProgramsSafe, upcomingCohorts } from "@/lib/formations-public"
import { shortDayMonth } from "@/lib/cohort-public"
import { nextCohortBadgeText } from "@/lib/hero-badge"

// Valeur actuelle du jeton {prochaine-cohorte} (accueil et apercu admin)
export async function getNextCohortBadge(): Promise<string | null> {
  const cohorts = upcomingCohorts(await getPublicProgramsSafe())
  return nextCohortBadgeText(cohorts.find((c) => c.status !== "full") ?? null, shortDayMonth)
}
