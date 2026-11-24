"use client"

import { useEffect } from "react"

// Repli des navigateurs sans animation-timeline : les mots s'allument quand
// ils passent dans le premier tiers de l'ecran (IntersectionObserver). Sans
// JavaScript ou en mouvement reduit, le texte reste entierement visible.
export function ManifestoLighter({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId)
    if (!root) return
    if (CSS.supports("animation-timeline: view()")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (typeof IntersectionObserver === "undefined") return

    root.classList.add("mani-armed")
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-lit")
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -35% 0px" }
    )
    root.querySelectorAll(".mani-word").forEach((word) => observer.observe(word))
    return () => observer.disconnect()
  }, [targetId])
  return null
}
