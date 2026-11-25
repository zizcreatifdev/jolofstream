"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Délai pendant lequel le choix reste visible avant l'étape suivante
const SELECT_DELAY_MS = 200
// Après le passage, la nouvelle étape ignore le pointeur pendant ce temps :
// le reste d'un double ou triple clic ne déclenche rien (Retour, puce, ligne)
const SETTLE_MS = 350

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Passage automatique à l'étape suivante sur un choix unique (carte, ligne).
// select() s'applique tout de suite (état sélectionné visible), next() après
// 200 ms, ou immédiatement en mouvement réduit. Un verrou empêche une seconde
// transition pendant le délai ; les clics répétés d'un même geste
// (event.detail > 1) sont ignorés ; « settling » vaut true juste après le
// passage, pour couper le pointeur sur la nouvelle étape. Clavier : detail
// vaut 0, aucune attente.
export function useAutoAdvance() {
  const locked = useRef(false)
  const timers = useRef<number[]>([])
  const [settling, setSettling] = useState(false)

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    []
  )

  const advance = useCallback((event: { detail: number }, select: () => void, next: () => void) => {
    if (locked.current || event.detail > 1) return
    locked.current = true
    select()
    const pointer = event.detail > 0
    const finish = () => {
      locked.current = false
      next()
      if (pointer) {
        setSettling(true)
        timers.current.push(window.setTimeout(() => setSettling(false), SETTLE_MS))
      }
    }
    if (prefersReducedMotion()) finish()
    else timers.current.push(window.setTimeout(finish, SELECT_DELAY_MS))
  }, [])

  return { advance, settling }
}
