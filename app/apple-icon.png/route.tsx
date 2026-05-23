import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  return NextResponse.redirect(
    new URL(
      "/logos/Jolof_logo_icon_FRouge.png",
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"
    )
  )
}
