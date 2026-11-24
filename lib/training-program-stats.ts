import { prisma } from "@/lib/prisma"

export type ProgramListItem = {
  id: string
  slug: string
  code: string | null
  name: string
  published: boolean
  brochurePublished: boolean
  hasBrochure: boolean
  order: number
  cohorts: number
  openCohorts: number
  registered: number
  confirmed: number
  collected: number
}

// Liste des programmes avec leurs chiffres (cohortes ouvertes, inscrits hors
// annulations, confirmes, encaisse = montant paye ou prix de la cohorte)
export async function listProgramsWithStats(): Promise<ProgramListItem[]> {
  const programs = await prisma.trainingProgram.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      cohorts: {
        select: {
          status: true,
          price: true,
          registrations: { select: { status: true, amountPaid: true } },
        },
      },
    },
  })
  return programs.map((p) => {
    let registered = 0
    let confirmed = 0
    let collected = 0
    for (const c of p.cohorts) {
      for (const r of c.registrations) {
        if (r.status === "annule") continue
        registered++
        if (r.status === "confirme") {
          confirmed++
          collected += r.amountPaid ?? c.price
        }
      }
    }
    return {
      id: p.id,
      slug: p.slug,
      code: p.code,
      name: p.name,
      published: p.published,
      brochurePublished: p.brochurePublished,
      hasBrochure: Boolean(p.brochureUrl),
      order: p.order,
      cohorts: p.cohorts.length,
      openCohorts: p.cohorts.filter((c) => c.status === "ouvert").length,
      registered,
      confirmed,
      collected,
    }
  })
}
