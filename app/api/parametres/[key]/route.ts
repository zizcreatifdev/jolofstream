import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: params.key },
    })
    if (!setting) {
      return NextResponse.json({ value: null }, { status: 200 })
    }
    return NextResponse.json({ key: setting.key, value: setting.value })
  } catch (error) {
    console.error("[api/parametres/:key GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
