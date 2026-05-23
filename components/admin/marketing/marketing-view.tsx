"use client"

import { useState } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ListesSidebar } from "@/components/admin/marketing/listes-sidebar"
import { ContactsTable } from "@/components/admin/marketing/contacts-table"
import { CampagnesList } from "@/components/admin/marketing/campagnes-list"

export function MarketingView() {
  const [selectedListe, setSelectedListe] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [tab, setTab] = useState<"contacts" | "campagnes">("contacts")

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "contacts" | "campagnes")}
    >
      <TabsList className="bg-zinc-100">
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="campagnes">Campagnes</TabsTrigger>
      </TabsList>

      <TabsContent value="contacts" className="mt-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <ListesSidebar
            selected={selectedListe}
            onSelect={setSelectedListe}
            refreshKey={refreshKey}
          />
          <ContactsTable
            selectedListe={selectedListe}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </TabsContent>

      <TabsContent value="campagnes" className="mt-4">
        <CampagnesList />
      </TabsContent>
    </Tabs>
  )
}
