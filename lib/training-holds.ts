import { prisma } from "@/lib/prisma"
import { COHORT_NAME_SELECT } from "@/lib/formations"

// Reservations dont le delai de paiement est depasse (etat calcule : la place
// reste comptee tant qu'un admin ne la libere pas)
export const overdueWhere = (now: Date = new Date()) => ({
  status: "en_attente",
  holdExpiresAt: { lt: now },
})

export async function countOverdueHolds(): Promise<number> {
  return prisma.trainingRegistration.count({ where: overdueWhere() })
}

export async function listOverdueHolds() {
  return prisma.trainingRegistration.findMany({
    where: overdueWhere(),
    orderBy: { holdExpiresAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      holdExpiresAt: true,
      registeredAt: true,
      session: { select: { id: true, price: true, ...COHORT_NAME_SELECT } },
    },
  })
}
