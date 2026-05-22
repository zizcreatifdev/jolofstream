import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Jolof Stream <onboarding@resend.dev>"

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
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to]
    if (recipients.length === 0) {
      return { success: false, error: "Aucun destinataire" }
    }
    await resend.emails.send({
      from: FROM_ADDRESS,
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
