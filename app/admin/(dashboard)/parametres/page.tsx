import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  ParametresClient,
  type ProfileBootstrap,
} from "@/components/admin/parametres/parametres-client"
import { PARAM_DEFAULTS } from "@/lib/parametres"

export default async function ParametresPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  const initialParams: Record<string, string> = { ...PARAM_DEFAULTS }
  let profile: ProfileBootstrap = {
    email: session.user.email ?? "",
    firstName: "",
    lastName: "",
    avatarUrl: null,
  }

  try {
    const settings = await prisma.setting.findMany()
    for (const s of settings) initialParams[s.key] = s.value
  } catch {
    // garde defaults
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, firstName: true, lastName: true, avatarUrl: true },
    })
    if (user) {
      profile = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      }
    }
  } catch {
    // garde defaults
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Parametres</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configuration de l&apos;entreprise, du site public, des PDFs et de
          votre profil.
        </p>
      </div>
      <ParametresClient initialParams={initialParams} profile={profile} />
    </div>
  )
}
