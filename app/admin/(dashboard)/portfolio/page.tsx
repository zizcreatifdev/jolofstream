import { PortfolioGridAdmin } from "@/components/admin/portfolio/portfolio-grid"

export default function PortfolioPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Portfolio</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Realisations publiees sur le site : photos ou miniatures YouTube,
          ordre d&apos;affichage personnalisable.
        </p>
      </div>
      <PortfolioGridAdmin />
    </div>
  )
}
