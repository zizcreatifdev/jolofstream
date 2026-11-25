"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// Nombre de demandes de devis « nouvelle », relu a chaque changement de page
export function useNewRequestsCount(): number {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetch("/api/demandes/count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { nouvelles: 0 }))
      .then((d) => {
        if (!cancelled) setCount(Number(d.nouvelles) || 0)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [pathname])
  return count
}

export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto rounded-full bg-[#C8151B] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> nouvelle{count > 1 ? "s" : ""}</span>
    </span>
  )
}
