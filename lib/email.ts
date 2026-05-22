import { Resend } from "resend"
import type React from "react"

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === "REMPLACER_CLE_RESEND") {
    return null
  }
  return new Resend(apiKey)
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient()
    if (!resend) {
      console.warn(
        "Resend non configure : RESEND_API_KEY manquante ou placeholder"
      )
      return { success: false, error: "Resend non configure" }
    }
    const from =
      process.env.EMAIL_FROM ?? "Jolof Stream <onboarding@resend.dev>"
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to]
    if (recipients.length === 0) {
      return { success: false, error: "Aucun destinataire" }
    }
    await resend.emails.send({
      from,
      to: recipients,
      subject,
      react,
    })
    return { success: true }
  } catch (error) {
    console.error("[resend]", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
