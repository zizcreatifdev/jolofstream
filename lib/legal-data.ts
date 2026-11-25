import { prisma } from "@/lib/prisma"
import { getPaymentDelayHours } from "@/lib/training-delay"
import { paymentDelayLabel } from "@/lib/cohort-public"
import { LEGAL_FIELDS } from "@/lib/legal-fields"

export { LEGAL_FIELDS }


export type LegalPageData = {
  content: string
  updatedAt: Date | null
  editor: Array<{ label: string; value: string }>
  delayLabel: string
}

// Contenu d'un document legal, date de modification, bloc editeur et delai
export async function getLegalPage(key: "cgv_content" | "mentions_legales_content"): Promise<LegalPageData> {
  try {
    const [rows, delayHours] = await Promise.all([
      prisma.setting.findMany({
        where: { key: { in: [key, ...LEGAL_FIELDS.map((f) => f.key)] } },
        select: { key: true, value: true, updatedAt: true },
      }),
      getPaymentDelayHours(),
    ])
    const map = new Map(rows.map((r) => [r.key, r]))
    return {
      content: map.get(key)?.value ?? "",
      updatedAt: map.get(key)?.updatedAt ?? null,
      editor: LEGAL_FIELDS.map((f) => ({ label: f.label, value: (map.get(f.key)?.value ?? "").trim() })).filter((f) => f.value),
      delayLabel: paymentDelayLabel(delayHours),
    }
  } catch {
    return { content: "", updatedAt: null, editor: [], delayLabel: paymentDelayLabel(48) }
  }
}

export function formatUpdatedAt(date: Date | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dakar" }).format(date)
}
