import { ContratDetail } from "@/components/admin/contrats/contrat-detail"

export const dynamic = "force-dynamic"

export default function ContratDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <ContratDetail id={params.id} />
}
