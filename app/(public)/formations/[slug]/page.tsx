import { notFound, permanentRedirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { cohortAvailability } from "@/lib/formations-public"

export const dynamic = "force-dynamic"

// Anciennes adresses /formations/[x] (sitemap d'avant la refonte) :
// programme visible -> ancre de /formations ; cohorte visible -> tunnel ;
// cohorte passee, annulee ou d'un programme masque -> /formations ; sinon 404.
// /formations/reserver (segment statique) et /formations/[slug]/plaquette
// ne passent pas par ici.
export default async function LegacyFormationPage({ params }: { params: { slug: string } }) {
  const segment = decodeURIComponent(params.slug)
  const program = await prisma.trainingProgram
    .findUnique({ where: { slug: segment }, select: { slug: true, published: true } })
    .catch(() => null)
  if (program?.published) permanentRedirect(`/formations#${program.slug}`)

  const cohort = await prisma.trainingSession
    .findUnique({
      where: { id: segment },
      select: {
        id: true,
        status: true,
        dateStart: true,
        dateEnd: true,
        program: { select: { slug: true, published: true } },
      },
    })
    .catch(() => null)
  if (cohort) {
    if (cohortAvailability(cohort).ok) {
      permanentRedirect(`/formations/reserver?f=${encodeURIComponent(cohort.program.slug)}&c=${encodeURIComponent(cohort.id)}`)
    }
    permanentRedirect("/formations")
  }
  notFound()
}
