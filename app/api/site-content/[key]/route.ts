import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateSite } from "@/lib/revalidate-site"
import { removeReplacedFiles } from "@/lib/storage-cleanup"
import {
  SITE_CONTENT_PATHS,
  SITE_CONTENT_SCHEMAS,
  parseSiteContent,
  type SiteContentKey,
} from "@/lib/site-content"

export const dynamic = "force-dynamic"

const LABELS: Record<SiteContentKey, string> = {
  home_manifesto: "Manifeste de l'accueil",
  home_skills: "Savoir-faire de l'accueil",
  home_final_cta: "Appel final de l'accueil",
  home_sections: "Titres des sections de l'accueil",
  services_content: "Contenu des services",
  services_page: "En-tete de la page Services",
  formations_page: "Textes de la page Formations",
  contact_page: "Textes de la page Contact",
  portfolio_page: "Textes de la page Portfolio",
  about_page: "En-tete de la page A propos",
  faq_items: "Questions frequentes",
}

function isKey(key: string): key is SiteContentKey {
  return Object.hasOwn(SITE_CONTENT_SCHEMAS, key)
}

// Images du bucket site referencees par un contenu (savoir-faire)
function siteImages(key: SiteContentKey, raw: string | null | undefined): string[] {
  if (key !== "home_skills") return []
  const content = parseSiteContent("home_skills", raw)
  return content ? content.items.map((i) => i.imageUrl).filter((u): u is string => Boolean(u)) : []
}

// Enregistre un bloc de contenu valide par son schema Zod
export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  if (!isKey(params.key)) {
    return NextResponse.json({ error: "Contenu inconnu" }, { status: 404 })
  }
  const key = params.key
  try {
    const value = SITE_CONTENT_SCHEMAS[key].parse(await req.json())
    const existing = await prisma.setting.findUnique({ where: { key } })
    const json = JSON.stringify(value)
    await prisma.setting.upsert({
      where: { key },
      update: { value: json, updatedBy: session.user.id },
      create: { key, value: json, updatedBy: session.user.id },
    })
    await removeReplacedFiles("site", siteImages(key, existing?.value), siteImages(key, json))
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Setting",
        entityId: key,
        description: `${LABELS[key]} modifie`,
      },
    })
    revalidateSite(SITE_CONTENT_PATHS[key])
    return NextResponse.json({ key, value })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Donnees invalides",
          issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      )
    }
    console.error("[api/site-content/:key PUT]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
