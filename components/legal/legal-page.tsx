import { Kicker, PAD } from "@/components/public/cine/primitives"
import { LegalText } from "@/components/legal/legal-text"
import { formatUpdatedAt, type LegalPageData } from "@/lib/legal-data"

// Gabarit commun des pages /mentions-legales et /cgv
export function LegalPage({
  kicker,
  title,
  accent,
  data,
  withEditor = false,
}: {
  kicker: string
  title: string
  accent: string
  data: LegalPageData
  withEditor?: boolean
}) {
  const updated = formatUpdatedAt(data.updatedAt)
  return (
    <>
      <section className={`bg-black pb-20 pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <Kicker>{kicker}</Kicker>
          <h1 className="mt-[22px] font-display text-[clamp(52px,8vw,130px)] font-normal leading-[0.9] tracking-[-0.025em]">
            {title} <em className="italic text-cine-yellow">{accent}</em>
          </h1>
        </div>
      </section>
      <section className={`bg-cine-cream py-[90px] text-cine-ink ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-[860px]">
            {withEditor && data.editor.length > 0 && (
              <>
                <h2 className="mb-3.5 font-display text-[36px] font-normal leading-[1.1] tracking-[-0.02em]">Éditeur du site</h2>
                <dl className="mb-14 grid grid-cols-1 gap-x-6 gap-y-2.5 min-[761px]:grid-cols-[minmax(160px,220px)_1fr]">
                  {data.editor.map((row) => (
                    <div key={row.label} className="contents">
                      <dt className="pt-1 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7A6660]">{row.label}</dt>
                      <dd className="m-0 break-words text-[16px] text-cine-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {data.content.trim() ? (
              <LegalText text={data.content} delayLabel={data.delayLabel} />
            ) : (
              !withEditor && <p className="text-[16px] text-[#4A3B38]">Document en cours de rédaction.</p>
            )}
            {updated && <p className="mt-14 font-mono text-[12px] uppercase tracking-[0.08em] text-[#7A6660]">Dernière mise à jour : {updated}</p>}
          </div>
        </div>
      </section>
    </>
  )
}
