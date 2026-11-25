"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, video[controls], [tabindex]:not([tabindex="-1"])'

// Piege du focus pour une fenetre modale : focus initial, Tab et Maj+Tab
// bouclent dans la fenetre, Echap ferme, le focus revient a l'element
// d'origine a la fermeture.
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onEscape: () => void
) {
  // Derniere fonction de fermeture, sans relancer l'effet a chaque rendu
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return
    const previous = document.activeElement as HTMLElement | null
    const items = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) =>
          el.getAttribute("tabindex") !== "-1" &&
          !el.hasAttribute("data-focus-sentinel") &&
          el.getClientRects().length > 0
      )
    const first = items()[0]
    ;(first ?? node).focus({ preventScroll: true })

    // Sentinelles en début et fin de fenêtre : une tabulation qui sort d'une
    // iframe (lecteur YouTube) ne déclenche pas keydown sur la page, elle
    // atterrit sur une sentinelle qui renvoie le focus dans la fenêtre.
    const sentinel = (onFocus: () => void) => {
      const el = document.createElement("span")
      el.tabIndex = 0
      el.setAttribute("data-focus-sentinel", "")
      el.setAttribute("aria-hidden", "true")
      el.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;"
      el.addEventListener("focus", onFocus)
      return el
    }
    const start = sentinel(() => {
      const list = items()
      ;(list[list.length - 1] ?? node).focus()
    })
    const end = sentinel(() => (items()[0] ?? node).focus())
    node.prepend(start)
    node.append(end)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        escapeRef.current()
        return
      }
      if (event.key !== "Tab") return
      const list = items()
      if (list.length === 0) {
        event.preventDefault()
        return
      }
      const head = list[0]
      const tail = list[list.length - 1]
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault()
        tail.focus()
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault()
        head.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      start.remove()
      end.remove()
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [ref, active])
}

// Blocage du defilement de la page pendant qu'une fenetre est ouverte
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = previous
    }
  }, [active])
}

const OPEN_DIALOG =
  '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'

// Vrai tant qu'une fenetre modale (menu, lecteur, Dialog Radix) est ouverte
export function useAnyDialogOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const check = () => setOpen(Boolean(document.querySelector(OPEN_DIALOG)))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-modal", "role"],
    })
    return () => observer.disconnect()
  }, [])
  return open
}

// Vrai si l'utilisateur demande moins d'animations ou economise ses donnees
export function useLowMotionOrData(): boolean {
  const [low, setLow] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection
    const update = () => setLow(media.matches || Boolean(connection?.saveData))
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return low
}
