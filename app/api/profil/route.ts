import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prenom requis").optional(),
    lastName: z.string().trim().min(1, "Nom requis").optional(),
    avatarUrl: z.string().trim().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.newPassword) return true
      return data.newPassword.length >= 8
    },
    { message: "Mot de passe : 8 caracteres minimum", path: ["newPassword"] }
  )
  .refine(
    (data) => {
      if (!data.newPassword) return true
      return data.newPassword === data.confirmPassword
    },
    {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    }
  )

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = profileSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.avatarUrl !== undefined)
      updateData.avatarUrl = data.avatarUrl || null
    if (data.newPassword) {
      updateData.password = await bcrypt.hash(data.newPassword, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ a mettre a jour" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        description: `Profil mis a jour : ${user.firstName} ${user.lastName}`,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/profil PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
