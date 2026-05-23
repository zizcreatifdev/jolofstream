"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log("[sw] enregistre", reg.scope)
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[sw] echec", err)
        })
    }

    if (document.readyState === "complete") {
      onLoad()
    } else {
      window.addEventListener("load", onLoad, { once: true })
      return () => window.removeEventListener("load", onLoad)
    }
  }, [])

  return null
}
