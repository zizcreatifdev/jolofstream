import { cn } from "@/lib/utils"
import { parseLegalText } from "@/lib/legal-text"

// Rendu d'un document legal (site et apercu admin). Aucun HTML interprete.
export function LegalText({
  text,
  delayLabel,
  variant = "site",
}: {
  text: string
  delayLabel?: string
  variant?: "site" | "admin"
}) {
  const blocks = parseLegalText(text, delayLabel)
  const site = variant === "site"
  return (
    <div className={cn(site ? "max-w-[860px]" : "space-y-3 text-sm")}>
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <h2
            key={i}
            className={cn(
              site
                ? "mb-3.5 mt-14 font-display text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-cine-ink first:mt-0"
                : "pt-2 text-base font-semibold text-zinc-900"
            )}
          >
            {block.text}
          </h2>
        ) : block.type === "list" ? (
          <ul key={i} className={cn("list-disc pl-5", site ? "my-4 space-y-1 text-[16px] leading-[1.8] text-[#4A3B38]" : "space-y-0.5 text-zinc-700")}>
            {block.items.map((item, k) => (
              <li key={k}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className={cn(site ? "my-4 text-[16px] leading-[1.8] text-[#4A3B38]" : "text-zinc-700")}>
            {block.text}
          </p>
        )
      )}
    </div>
  )
}
