import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isPublicParamKey } from "@/lib/parametres"

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions)
  const isAdmin = Boolean(session?.user)

  if (!isAdmin && !isPublicParamKey(params.key)) {
    return NextResponse.json({ value: null }, { status: 200 })
  }

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
