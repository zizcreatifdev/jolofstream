import { Suspense } from "react"

import { CampaignDetailView } from "@/components/admin/marketing/campaign-detail-view"

export const dynamic = "force-dynamic"

export default function CampagneDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Suspense fallback={null}>
      <CampaignDetailView id={params.id} />
    </Suspense>
  )
}
