import { CampaignDetailView } from "@/components/admin/marketing/campaign-detail-view"

export const dynamic = "force-dynamic"

export default function CampagneDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <CampaignDetailView id={params.id} />
}
