import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { JournalTab } from "@/components/admin/journal/journal-tab"
import { TasksTab } from "@/components/admin/journal/tasks-tab"

export default async function JournalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/admin/login")

  let users: Array<{ id: string; firstName: string; lastName: string }> = []
  try {
    users = await prisma.user.findMany({
      orderBy: { email: "asc" },
      select: { id: true, firstName: true, lastName: true },
    })
  } catch {
    users = []
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Journal d&apos;activite
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Historique des actions et taches partagees entre cofondateurs.
        </p>
      </div>

      <Tabs defaultValue="journal">
        <TabsList>
          <TabsTrigger value="journal">Journal d&apos;activite</TabsTrigger>
          <TabsTrigger value="taches">Taches</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-4">
          <JournalTab users={users} />
        </TabsContent>

        <TabsContent value="taches" className="mt-4">
          <TasksTab users={users} currentUserId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
