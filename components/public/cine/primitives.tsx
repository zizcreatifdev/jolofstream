import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { parseEmphasis } from "@/lib/site-content"

// Briques visuelles communes des pages V2 (composants serveur)

export function Kicker({
  children,
  tone = "dark",
  className,
}: {
  children: React.ReactNode
  tone?: "dark" | "light"
  className?: string
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3 font-mono text-[12px] font-semibold uppercase tracking-[0.18em]",
        tone === "dark" ? "text-cine-yellow" : "text-cine-red",
        className
      )}
    >
      <i aria-hidden="true" className="cine-blink block h-2 w-2 shrink-0 rounded-full bg-cine-red" />
      {children}
    </p>
  )
}

// Titre de section : ligne normale puis accent italique (jaune ou rouge)
export function CineHeading({
  as: Tag = "h2",
  title,
  accent,
  tone = "dark",
  className,
  breakLine = true,
}: {
  as?: "h1" | "h2" | "h3"
  title: string
  accent?: string | null
  tone?: "dark" | "light"
  className?: string
  breakLine?: boolean
}) {
  return (
    <Tag
      className={cn(
        "font-display font-normal leading-[0.94] tracking-[-0.025em]",
        className ?? "mt-[18px] text-[clamp(44px,6vw,96px)]"
      )}
    >
      {title}
      {accent ? (
        <>
          {breakLine ? <br /> : " "}
          <em className={cn("italic", tone === "dark" ? "text-cine-yellow" : "text-cine-red")}>
            {accent}
          </em>
        </>
      ) : null}
    </Tag>
  )
}

// Texte avec la syntaxe *italique* et **rouge**
export function Emphasis({
  text,
  emClassName = "italic text-cine-yellow",
  strongClassName = "text-cine-red",
}: {
  text: string
  emClassName?: string
  strongClassName?: string
}) {
  return (
    <>
      {parseEmphasis(text).map((segment, i) =>
        segment.style === "em" ? (
          <em key={i} className={emClassName}>
            {segment.text}
          </em>
        ) : segment.style === "strong" ? (
          <span key={i} className={strongClassName}>
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  )
}

const BUTTON_BASE =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-[26px] text-[15px] font-semibold transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5"

const BUTTON_VARIANTS = {
  red: "bg-cine-red text-white hover:bg-cine-red-dark",
  ink: "bg-cine-bg text-white hover:bg-black",
  outDark:
    "text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.3)] hover:bg-cine-cream hover:text-cine-bg",
  outLight:
    "text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.25)] hover:bg-cine-ink hover:text-white",
  outWhite:
    "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] hover:bg-white hover:text-cine-red",
} as const

export function CineButton({
  href,
  variant = "red",
  arrow = false,
  className,
  children,
}: {
  href: string
  variant?: keyof typeof BUTTON_VARIANTS
  arrow?: boolean
  className?: string
  children: React.ReactNode
}) {
  const classes = cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)
  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
    </>
  )
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <a href={href} className={classes}>
      {content}
    </a>
  )
}

export const PAD = "px-[clamp(18px,4.5vw,72px)]"
