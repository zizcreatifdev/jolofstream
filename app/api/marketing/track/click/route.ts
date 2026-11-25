import { NextRequest, NextResponse } from "next/server"

import { contactEmailFromParams } from "@/lib/marketing-token"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const FALLBACK_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"

function parseHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol === "http:" || u.protocol === "https:") return u
  } catch {
    // ignore
  }
  return null
}

function isOwnSite(u: URL): boolean {
  const own = new Set(["jolofstream.com", "www.jolofstream.com"])
  try {
    own.add(new URL(FALLBACK_BASE_URL).host)
  } catch {
    // ignore
  }
  return own.has(u.host)
}

// Pas de redirection ouverte : la cible doit être un lien présent dans le
// corps de la campagne, ou une page du site.
export async function GET(req: NextRequest) {
  const home = new URL("/", FALLBACK_BASE_URL)
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId") ?? ""
    const email = contactEmailFromParams(searchParams)
    const urlParam = searchParams.get("url") ?? ""
    const target = urlParam ? parseHttpUrl(urlParam) : null
    if (!target || !campaignId) return NextResponse.redirect(home, 302)

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, body: true },
    })
    const body = campaign?.body ?? ""
    const allowed =
      isOwnSite(target) ||
      body.includes(urlParam) ||
      body.includes(urlParam.replace(/&/g, "&amp;"))
    if (!campaign || !allowed) return NextResponse.redirect(home, 302)

    if (email) {
      try {
        await prisma.campaignClick.create({
          data: {
            campaignId,
            contactEmail: email,
            url: target.toString(),
            userAgent: req.headers.get("user-agent") ?? null,
          },
        })
      } catch (e) {
        console.warn("[track/click] DB", e)
      }
    }

    return NextResponse.redirect(target, 302)
  } catch (e) {
    console.warn("[track/click]", e)
    return NextResponse.redirect(home, 302)
  }
}
