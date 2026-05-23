import { NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf-8")
  } catch {
    return null
  }
}

function htmlPage({
  title,
  message,
  email,
}: {
  title: string
  message: string
  email?: string
}): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - Jolof Stream</title>
<style>
  body { margin: 0; padding: 60px 20px; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; text-align: center; }
  .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  h1 { color: #C8151B; font-size: 22px; margin: 0 0 12px; }
  p { color: #52525b; line-height: 1.6; margin: 8px 0; }
  .email { display: inline-block; background: #fafafa; padding: 4px 10px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #18181b; }
  .brand { margin-top: 32px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${email ? `<p><span class="email">${email}</span></p>` : ""}
    <p class="brand">Jolof Stream - Dakar, Senegal</p>
  </div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const emailParam = searchParams.get("email") ?? ""
  const email = decodeBase64(emailParam)?.toLowerCase().trim()

  if (!email) {
    return new Response(
      htmlPage({
        title: "Lien invalide",
        message:
          "Le lien de desabonnement est invalide ou expire. Vous pouvez nous contacter directement a jolofstream@gmail.com.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    )
  }

  try {
    const contact = await prisma.marketingContact.findUnique({
      where: { email },
      select: { id: true, unsubscribed: true },
    })
    if (contact && !contact.unsubscribed) {
      await prisma.marketingContact.update({
        where: { id: contact.id },
        data: { unsubscribed: true },
      })
    }
  } catch (e) {
    console.warn("[unsubscribe]", e)
  }

  return new Response(
    htmlPage({
      title: "Desabonnement confirme",
      message:
        "Vous avez ete desabonne avec succes. Vous ne recevrez plus d'emails de Jolof Stream.",
      email,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  )
}
