import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Jolof Stream</h1>
      <p className="text-zinc-500 mt-2">
        Connecte en tant que : {session.user.email}
      </p>
    </div>
  )
}
