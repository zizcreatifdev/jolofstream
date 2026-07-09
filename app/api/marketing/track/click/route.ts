import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const FALLBACK_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf-8")
  } catch {
    return null
  }
}

function safeTargetUrl(raw: string): URL {
  try {
    const u = new URL(raw)
    if (u.protocol === "http:" || u.protocol === "https:") return u
  } catch {
    // ignore
  }
  return new URL("/", FALLBACK_BASE_URL)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId") ?? ""
    const emailParam = searchParams.get("email") ?? ""
    const urlParam = searchParams.get("url") ?? ""
    const email = decodeBase64(emailParam)
    const target = urlParam
      ? safeTargetUrl(decodeURIComponent(urlParam))
      : new URL("/", FALLBACK_BASE_URL)

    if (campaignId && email) {
      try {
        const exists = await prisma.marketingCampaign.findUnique({
          where: { id: campaignId },
          select: { id: true },
        })
        if (exists) {
          await prisma.campaignClick.create({
            data: {
              campaignId,
              contactEmail: email.toLowerCase().trim(),
              url: target.toString(),
              userAgent: req.headers.get("user-agent") ?? null,
            },
          })
        }
      } catch (e) {
        console.warn("[track/click] DB", e)
      }
    }

    return NextResponse.redirect(target, 302)
  } catch (e) {
    console.warn("[track/click]", e)
    return NextResponse.redirect(new URL("/", FALLBACK_BASE_URL), 302)
  }
}
