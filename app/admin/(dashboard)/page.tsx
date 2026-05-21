import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-zinc-500">
        Bienvenue, {session?.user?.name ?? session?.user?.email}
      </p>
      <p className="mt-4 text-sm text-zinc-400">KPIs et widgets - Prompt 13</p>
    </div>
  )
}
