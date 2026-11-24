import { Resend } from "resend"
import { render } from "@react-email/components"
import type React from "react"

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === "REMPLACER_CLE_RESEND") {
    return null
  }
  return new Resend(apiKey)
}

type SendEmailInput = {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  html?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  html,
}: SendEmailInput): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const resend = getResendClient()
    if (!resend) {
      console.warn(
        "Resend non configure : RESEND_API_KEY manquante ou placeholder"
      )
      return { success: false, error: "Resend non configure" }
    }
    if (!react && !html) {
      return { success: false, error: "Aucun contenu (react ou html requis)" }
    }
    const from =
      process.env.EMAIL_FROM ?? "Jolof Stream <onboarding@resend.dev>"
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to]
    if (recipients.length === 0) {
      return { success: false, error: "Aucun destinataire" }
    }
    // Rendu HTML ici : l'option react de Resend importe @react-email/render,
    // paquet installe seulement sous @react-email/components, que le build
    // remplace par un module vide ("t is not a function" a l'envoi).
    const body = react ? await render(react) : (html as string)
    // Resend ne leve pas d'exception sur une erreur API : il renvoie { data, error }
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html: body,
    })
    if (error) {
      console.error("[email] Echec Resend", { to: recipients, subject, error })
      return { success: false, error: error.message ?? "Erreur Resend" }
    }
    return { success: true, id: data?.id }
  } catch (error) {
    console.error("[resend]", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
