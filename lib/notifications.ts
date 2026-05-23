import { prisma } from "@/lib/prisma"

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
  try {
    return await prisma.notification.create({
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
    return null
  }
}

export async function notifyAllAdmins(
  input: Omit<CreateNotificationInput, "userId">
) {
  try {
    const admins = await prisma.user.findMany({ select: { id: true } })
    if (admins.length === 0) return []
    return await Promise.all(
      admins.map((admin) => createNotification({ ...input, userId: admin.id }))
    )
  } catch (e) {
    console.warn("[notifyAllAdmins]", e)
    return []
  }
}
