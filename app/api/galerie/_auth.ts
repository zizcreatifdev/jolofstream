import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"

// Session admin obligatoire pour toutes les routes de la galerie
export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  return { userId: session.user.id }
}

export function errorResponse(error: unknown, where: string): NextResponse {
  if (error instanceof z.ZodError) {
    const issues: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form"
      ;(issues[key] ??= []).push(issue.message)
    }
    return NextResponse.json({ error: "Données invalides", issues }, { status: 400 })
  }
  console.error(`[api/galerie ${where}]`, error)
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
}
