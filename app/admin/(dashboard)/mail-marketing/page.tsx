import { MarketingView } from "@/components/admin/marketing/marketing-view"

export const dynamic = "force-dynamic"

export default function MailMarketingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Mail Marketing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestion des contacts, listes de diffusion et synchronisation CRM.
        </p>
        <p className="mt-1 text-xs italic text-zinc-400">
          Le module d&apos;envoi de campagnes sera disponible au Prompt 21.
        </p>
      </div>
      <MarketingView />
    </div>
  )
}
