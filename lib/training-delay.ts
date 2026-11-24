import { prisma } from "@/lib/prisma"
import { PARAM_KEYS } from "@/lib/parametres"
import { parsePaymentDelay } from "@/lib/training-programs"

// Delai de paiement d'une reservation (Parametres > Formations), en heures
export async function getPaymentDelayHours(): Promise<number> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: PARAM_KEYS.training_payment_delay_hours },
    })
    return parsePaymentDelay(row?.value)
  } catch {
    return parsePaymentDelay(null)
  }
}
