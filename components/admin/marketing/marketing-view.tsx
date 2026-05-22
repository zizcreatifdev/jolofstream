"use client"

import { useState } from "react"

import { ListesSidebar } from "@/components/admin/marketing/listes-sidebar"
import { ContactsTable } from "@/components/admin/marketing/contacts-table"

export function MarketingView() {
  const [selectedListe, setSelectedListe] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
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
  )
}
