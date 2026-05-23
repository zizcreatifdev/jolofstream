import webPush from "web-push"

import { prisma } from "@/lib/prisma"

let vapidConfigured = false

function configureVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:jolofstream@gmail.com",
      publicKey,
      privateKey
    )
    vapidConfigured = true
    return true
  } catch (e) {
    console.warn("[push] VAPID configuration failed", e)
    return false
  }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!configureVapid()) return { sent: 0, failed: 0 }

  let subscriptions
  try {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })
  } catch (e) {
    console.warn("[push] DB indisponible", e)
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0
  const expiredIds: string[] = []

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon ?? "/logos/Jolof_logo_icon_FRouge.png",
          badge: payload.badge ?? "/logos/Jolof_logo_icon_FRouge.png",
          url: payload.url ?? "/admin",
          data: { url: payload.url ?? "/admin" },
        })
      )
      sent += 1
    } catch (error) {
      failed += 1
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        ((error as { statusCode: number }).statusCode === 410 ||
          (error as { statusCode: number }).statusCode === 404)
      ) {
        expiredIds.push(sub.id)
      }
    }
  }

  if (expiredIds.length > 0) {
    try {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      })
    } catch {
      // best-effort
    }
  }

  return { sent, failed }
}

export async function sendPushToAllAdmins(
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!configureVapid()) return { sent: 0, failed: 0 }
  try {
    const admins = await prisma.user.findMany({ select: { id: true } })
    const results = await Promise.all(
      admins.map((admin) => sendPushToUser(admin.id, payload))
    )
    return results.reduce(
      (acc, r) => ({
        sent: acc.sent + r.sent,
        failed: acc.failed + r.failed,
      }),
      { sent: 0, failed: 0 }
    )
  } catch (e) {
    console.warn("[push] sendPushToAllAdmins", e)
    return { sent: 0, failed: 0 }
  }
}
