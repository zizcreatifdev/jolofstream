import { revalidatePath } from "next/cache"

// Regenere les pages publiques concernees apres une modification dans l'admin
export function revalidateSite(paths: string[]): void {
  for (const path of Array.from(new Set(paths))) revalidatePath(path)
}

export const TESTIMONIAL_PATHS = ["/", "/formations"]
export const OFFER_PATHS = ["/", "/services"]
export const FORMATION_PATHS = ["/", "/formations"]
export const PORTFOLIO_PATHS = ["/", "/portfolio"]
