import { prisma } from "@/lib/prisma"
import { sendPushToAllAdmins, sendPushToUser } from "@/lib/push-notifications"

export type NotificationType =
  | "nouveau_lead"
  | "nouvelle_inscription"
  | "paiement_confirme"
  | "facture_impayee"
  | "contrat_signe"
  | "tache_assignee"

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
  entityUrl?: string
}

export async function createNotification(input: CreateNotificationInput) {
  let created = null
  try {
    created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        entityUrl: input.entityUrl ?? null,
      },
    })
  } catch (e) {
    console.warn("[createNotification]", e)
  }

  // Push non bloquant
  sendPushToUser(input.userId, {
    title: input.title,
    body: input.message,
    url: input.entityUrl ?? "/admin",
  }).catch(() => undefined)

  return created
}

export async function notifyAllAdmins(
  input: Omit<CreateNotificationInput, "userId">
) {
  let inApp: Array<unknown> = []
  try {
    const admins = await prisma.user.findMany({ select: { id: true } })
    if (admins.length > 0) {
      inApp = await Promise.all(
        admins.map((admin) =>
          prisma.notification
            .create({
              data: {
                userId: admin.id,
                type: input.type,
                title: input.title,
                message: input.message,
                entityType: input.entityType ?? null,
                entityId: input.entityId ?? null,
                entityUrl: input.entityUrl ?? null,
              },
            })
            .catch((e) => {
              console.warn("[notifyAllAdmins create]", e)
              return null
            })
        )
      )
    }
  } catch (e) {
    console.warn("[notifyAllAdmins]", e)
  }

  // Push non bloquant pour tous les admins
  sendPushToAllAdmins({
    title: input.title,
    body: input.message,
    url: input.entityUrl ?? "/admin",
  }).catch(() => undefined)

  return inApp
}
