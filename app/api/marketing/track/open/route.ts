import { NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

function pixelResponse(): Response {
  return new Response(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf-8")
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId") ?? ""
    const emailParam = searchParams.get("email") ?? ""
    const email = decodeBase64(emailParam)

    if (campaignId && email) {
      try {
        const exists = await prisma.marketingCampaign.findUnique({
          where: { id: campaignId },
          select: { id: true },
        })
        if (exists) {
          await prisma.campaignOpen.create({
            data: {
              campaignId,
              contactEmail: email.toLowerCase().trim(),
              userAgent: req.headers.get("user-agent") ?? null,
            },
          })
        }
      } catch (e) {
        console.warn("[track/open] DB", e)
      }
    }

    return pixelResponse()
  } catch (e) {
    console.warn("[track/open]", e)
    return pixelResponse()
  }
}
