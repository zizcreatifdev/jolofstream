import Image from "next/image"

import { cn } from "@/lib/utils"
import { sceneKicker } from "@/lib/site-nav"
import { PAGE_HERO_POSITION, PAGE_HERO_SCRIM } from "@/components/public/cine/page-hero-style"
import type { PageHero } from "@/lib/site-content"
import { CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"

// En-tête commun des pages publiques. Le surtitre est précédé du numéro de
// scène calculé depuis la navigation. Avec une image (Paramètres > Contenu du
// site > En-têtes de pages) : plein cadre, voile de lisibilité, léger zoom
// arrière à l'apparition (coupé en mouvement réduit). Sans image : en-tête
// noir d'origine. children s'affiche sous le texte (ou sous l'image).
export function PageHeader({
  path,
  kicker,
  title,
  accent,
  lead,
  hero,
  leadClassName = "max-w-[560px]",
  paddingBottom = "pb-[90px]",
  children,
}: {
  path: string
  kicker?: string | null
  title: React.ReactNode
  accent?: string | null
  lead?: string | null
  hero?: PageHero | null
  leadClassName?: string
  paddingBottom?: string
  children?: React.ReactNode
}) {
  const kickerText = sceneKicker(path, kicker)
  const heading =
    typeof title === "string" ? (
      <CineHeading as="h1" title={title} accent={accent} className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]" />
    ) : (
      title
    )

  if (!hero) {
    return (
      <section className={cn("bg-black pt-[180px] text-cine-cream min-[761px]:pt-[210px]", paddingBottom, PAD)}>
        <div className="mx-auto max-w-[1440px]">
          {kickerText && <Kicker>{kickerText}</Kicker>}
          {heading}
          {lead && <p className={cn("mt-[22px] text-[18px] leading-[1.7] text-cine-cream/70", leadClassName)}>{lead}</p>}
          {children}
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="relative flex min-h-[56vh] flex-col justify-end overflow-hidden bg-black text-cine-cream min-[761px]:min-h-[72vh]">
        <Image
          src={hero.imageUrl}
          alt={hero.alt}
          fill
          priority
          sizes="100vw"
          className={cn("cine-hero-zoom object-cover", PAGE_HERO_POSITION[hero.focal])}
        />
        <span aria-hidden="true" className={cn("absolute inset-0", PAGE_HERO_SCRIM)} />
        <div className={cn("relative pb-[70px] pt-[150px] min-[761px]:pb-[90px]", PAD)}>
          <div className="mx-auto max-w-[1440px]">
            {kickerText && <Kicker>{kickerText}</Kicker>}
            {heading}
            {lead && <p className={cn("mt-[22px] text-[18px] leading-[1.7] text-cine-cream/85", leadClassName)}>{lead}</p>}
          </div>
        </div>
      </section>
      {children && (
        <section className={cn("bg-black pt-px text-cine-cream", paddingBottom, PAD)}>
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </section>
      )}
    </>
  )
}
