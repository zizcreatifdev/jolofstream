"use client"

import { useEffect } from "react"

// /services?s=creator : arrivee directe sur le chapitre (defilement
// instantane, scroll-margin-top sous l'en-tete fixe)
export function ChapterScroll({ anchors }: { anchors: Record<string, string> }) {
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("s")
    const anchor = key ? anchors[key] : undefined
    if (!anchor) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "instant", block: "start" })
    })
    return () => cancelAnimationFrame(frame)
  }, [anchors])
  return null
}
