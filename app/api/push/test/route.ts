import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { sendPushToUser } from "@/lib/push-notifications"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    const result = await sendPushToUser(session.user.id, {
      title: "Test Jolof Stream",
      body: "Cette notification confirme que les notifications push fonctionnent.",
      url: "/admin",
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/push/test]", error)
    return NextResponse.json(
      { error: "Echec de l'envoi" },
      { status: 500 }
    )
  }
}
