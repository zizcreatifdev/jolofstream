import { emphasisWords, type HomeManifesto } from "@/lib/site-content"
import { Kicker, PAD } from "@/components/public/cine/primitives"
import { ManifestoLighter } from "@/components/public/home/manifesto-lighter"

// Manifeste : grand texte serif dont les mots s'allument un par un
export function ManifestoSection({ content }: { content: HomeManifesto | null }) {
  const text = content?.text.trim() ?? ""
  if (!content || !text) return null
  const words = emphasisWords(text)
  return (
    <section className={`bg-cine-bg py-[110px] text-cine-cream min-[761px]:py-[180px] ${PAD}`}>
      <div className="mx-auto max-w-[1440px]">
        {content.kicker && <Kicker>{content.kicker}</Kicker>}
        <p
          id="manifeste"
          className="mt-[26px] max-w-[1240px] font-display text-[clamp(36px,5.2vw,80px)] leading-[1.08] tracking-[-0.025em]"
        >
          {words.map((word, i) => (
            <span key={i}>
              <span
                className={
                  word.style === "em"
                    ? "mani-word italic text-cine-yellow"
                    : word.style === "strong"
                      ? "mani-word text-cine-red"
                      : "mani-word"
                }
              >
                {word.text}
              </span>{" "}
            </span>
          ))}
        </p>
        <ManifestoLighter targetId="manifeste" />
      </div>
    </section>
  )
}
