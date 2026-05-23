import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf-8")
  } catch {
    return null
  }
}

function safeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString()
  } catch {
    // ignore
  }
  return "/"
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId") ?? ""
    const emailParam = searchParams.get("email") ?? ""
    const urlParam = searchParams.get("url") ?? ""
    const email = decodeBase64(emailParam)
    const target = urlParam ? safeUrl(decodeURIComponent(urlParam)) : "/"

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
              url: target,
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
    return NextResponse.redirect(new URL("/", req.url), 302)
  }
}
