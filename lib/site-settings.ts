import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/prisma"
import { PARAM_DEFAULTS } from "@/lib/parametres"

// Coordonnees et reseaux du site public, lus dans les Parametres (Setting).
// Repli sur PARAM_DEFAULTS si la base ne repond pas.
export type SiteSocial = {
  key: "instagram" | "facebook" | "youtube" | "linkedin" | "tiktok"
  label: string
  href: string
}

export type SiteContact = {
  companyName: string
  phone: string
  phoneHref: string
  email: string
  address: string
  hours: string
  socials: SiteSocial[]
}

const KEYS = [
  "company_name",
  "company_phone",
  "company_email",
  "company_address",
  "company_hours",
  "social_instagram",
  "social_facebook",
  "social_youtube",
  "social_linkedin",
  "social_tiktok",
] as const

const SOCIALS: Array<{ key: SiteSocial["key"]; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
]

function buildContact(map: Map<string, string>): SiteContact {
  const get = (key: string) =>
    (map.get(key) ?? PARAM_DEFAULTS[key] ?? "").trim()
  const phone = get("company_phone")
  return {
    companyName: get("company_name") || "Jolof Stream",
    phone,
    phoneHref: phone.replace(/[^+0-9]/g, ""),
    email: get("company_email"),
    address: get("company_address"),
    hours: get("company_hours"),
    // Seuls les reseaux renseignes en https sont affiches
    socials: SOCIALS.map((s) => ({ ...s, href: get(`social_${s.key}`) })).filter(
      (s) => /^https:\/\//i.test(s.href)
    ),
  }
}

export const getSiteContact = unstable_cache(
  async (): Promise<SiteContact> => {
    try {
      const rows = await prisma.setting.findMany({
        where: { key: { in: [...KEYS] } },
        select: { key: true, value: true },
      })
      return buildContact(new Map(rows.map((r) => [r.key, r.value])))
    } catch (error) {
      console.warn("[site-settings] parametres indisponibles", error)
      return buildContact(new Map())
    }
  },
  ["site-contact"],
  { revalidate: 60 }
)
