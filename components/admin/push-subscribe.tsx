"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, BellRing, CheckCircle2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PushState = "loading" | "unsupported" | "denied" | "default" | "granted"

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalized)
  const buffer = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i)
  return buffer
}

export function PushSubscribe() {
  const [state, setState] = useState<PushState>("loading")
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }
    const permission = Notification.permission
    if (permission === "denied") {
      setState("denied")
      setSubscribed(false)
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(Boolean(sub))
      setState(permission === "granted" ? "granted" : "default")
    } catch {
      setState(permission === "granted" ? "granted" : "default")
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const handleSubscribe = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        throw new Error(
          "Cle VAPID publique manquante (NEXT_PUBLIC_VAPID_PUBLIC_KEY)."
        )
      }
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default")
        if (permission === "denied") {
          setError(
            "Permission refusee. Modifiez les parametres du navigateur pour autoriser les notifications."
          )
        }
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      const json = sub.toJSON() as {
        endpoint: string
        keys?: { p256dh?: string; auth?: string }
      }
      if (!json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Cles d'abonnement manquantes.")
      }

      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          userAgent: navigator.userAgent,
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.error || "Echec de l'enregistrement")
      }

      setSubscribed(true)
      setState("granted")
      setInfo("Notifications push activees.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  const handleUnsubscribe = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined)
        await sub.unsubscribe().catch(() => undefined)
      }
      setSubscribed(false)
      setInfo("Notifications push desactivees sur cet appareil.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const r = await fetch("/api/push/test", { method: "POST" })
      const data = (await r.json().catch(() => null)) as
        | { sent: number; failed: number }
        | { error: string }
        | null
      if (!r.ok || !data || "error" in data) {
        throw new Error(
          (data && "error" in data && data.error) || "Echec du test"
        )
      }
      setInfo(
        `Notification test envoyee : ${data.sent} delivree${data.sent > 1 ? "s" : ""}${
          data.failed > 0 ? `, ${data.failed} echec${data.failed > 1 ? "s" : ""}` : ""
        }.`
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            state === "granted" && subscribed
              ? "bg-emerald-100 text-emerald-700"
              : state === "denied"
                ? "bg-red-100 text-red-700"
                : "bg-zinc-100 text-zinc-600"
          )}
        >
          {state === "granted" && subscribed ? (
            <BellRing className="h-4 w-4" />
          ) : state === "denied" ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900">
            Notifications push
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Recevez les nouveaux leads, inscriptions et paiements meme quand
            le dashboard est ferme.
          </p>

          {state === "loading" && (
            <p className="mt-3 text-xs text-zinc-500">Verification...</p>
          )}

          {state === "unsupported" && (
            <p className="mt-3 text-xs text-zinc-500">
              Votre navigateur ne supporte pas les notifications push. Utilisez
              Chrome, Edge ou Firefox sur desktop, ou Chrome sur Android.
            </p>
          )}

          {state === "denied" && (
            <p className="mt-3 text-xs text-red-700">
              Les notifications sont bloquees. Reactivez-les dans les
              parametres du navigateur (cadenas a gauche de l&apos;URL).
            </p>
          )}

          {(state === "default" || state === "granted") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!subscribed && (
                <Button
                  size="sm"
                  onClick={handleSubscribe}
                  disabled={busy}
                  className="bg-[#C8151B] text-white hover:bg-[#a01015]"
                >
                  <Bell className="mr-1.5 h-3.5 w-3.5" />
                  {busy ? "Activation..." : "Activer les notifications push"}
                </Button>
              )}
              {subscribed && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Notifications activees sur cet appareil
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={busy}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Envoyer un test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                    disabled={busy}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <BellOff className="mr-1.5 h-3.5 w-3.5" />
                    Desactiver
                  </Button>
                </>
              )}
            </div>
          )}

          {info && (
            <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
              {info}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
