"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export type ChapterLink = { anchor: string; number: string; label: string }

// Navigation des chapitres, collante a gauche sur grand ecran. Le chapitre
// visible est mis en avant (IntersectionObserver).
export function ChapterNav({ chapters }: { chapters: ChapterLink[] }) {
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setCurrent(visible[0].target.id)
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    for (const c of chapters) {
      const el = document.getElementById(c.anchor)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [chapters])

  return (
    <nav
      aria-label="Chapitres des services"
      className="pointer-events-auto sticky top-[120px] rounded-xl bg-cine-bg2 p-2 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.1)]"
    >
      <ul className="space-y-0.5">
        {chapters.map((c) => {
          const active = current === c.anchor
          return (
            <li key={c.anchor}>
              <a
                href={`#${c.anchor}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors",
                  active ? "bg-cine-cream/10 text-white" : "text-cine-cream/70 hover:text-white"
                )}
              >
                <small
                  className={cn(
                    "font-mono text-[11px] font-semibold",
                    active ? "text-cine-yellow" : "text-cine-cream/60"
                  )}
                >
                  {c.number}
                </small>
                {c.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
