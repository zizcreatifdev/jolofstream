import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { Providers } from "@/components/admin/providers"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { BottomNav } from "@/components/admin/bottom-nav"
import { PwaRegister } from "@/components/public/pwa-register"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  return (
    <Providers>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-[240px]">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <PwaRegister />
    </Providers>
  )
}
