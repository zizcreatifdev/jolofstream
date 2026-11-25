export interface CampaignTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "nouvelle_formation",
    name: "Nouvelle formation",
    description: "Annonce d'une nouvelle session de formation",
    subject: "Nouvelle formation disponible - Jolof Stream",
    body: `<h2>Une nouvelle formation vous attend !</h2>
<p>Bonjour {{prenom}},</p>
<p>Nous avons le plaisir de vous annoncer l'ouverture des inscriptions pour notre prochaine formation.</p>
<h3>{{titre_formation}}</h3>
<ul>
<li>Date : {{date}}</li>
<li>Lieu : {{lieu}}</li>
<li>Places disponibles : {{places}}</li>
<li>Tarif : {{tarif}} FCFA</li>
</ul>
<p>Les places sont limitées. Inscrivez-vous rapidement !</p>
<a href="https://jolofstream.com/formations" style="background:#C8151B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">S'inscrire maintenant</a>`,
  },
  {
    id: "offre_service",
    name: "Offre de service",
    description: "Présentation d'un service ou forfait",
    subject: "Découvrez notre offre {{nom_service}} - Jolof Stream",
    body: `<h2>{{nom_service}}</h2>
<p>Bonjour {{prenom}},</p>
<p>Chez Jolof Stream, nous transformons vos événements en expériences digitales mémorables.</p>
<p>{{description_service}}</p>
<h3>Ce que nous proposons :</h3>
<ul>
<li>Captation multi-caméras HD</li>
<li>Diffusion en direct sur toutes les plateformes</li>
<li>Livraison des enregistrements sous 48h</li>
</ul>
<a href="https://jolofstream.com/contact" style="background:#C8151B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Demander un devis</a>`,
  },
  {
    id: "relance_prospect",
    name: "Relance prospect",
    description: "Relance d'un prospect qui n'a pas donné suite",
    subject: "Votre projet de diffusion - Jolof Stream",
    body: `<h2>On pense à votre projet</h2>
<p>Bonjour {{prenom}},</p>
<p>Vous nous avez contactés il y a quelque temps pour un projet de captation/diffusion.</p>
<p>Nous souhaitons savoir si votre projet est toujours d'actualité et si nous pouvons vous aider.</p>
<p>Chez Jolof Stream, nous proposons :</p>
<ul>
<li>Captation multi-caméras HD</li>
<li>Streaming sur YouTube, Facebook Live, Zoom</li>
<li>Devis personnalisé sous 24h</li>
</ul>
<a href="https://jolofstream.com/contact" style="background:#C8151B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Reprendre contact</a>`,
  },
  {
    id: "remerciement",
    name: "Remerciement client",
    description: "Message de remerciement après une prestation",
    subject: "Merci pour votre confiance - Jolof Stream",
    body: `<h2>Merci pour votre confiance !</h2>
<p>Bonjour {{prenom}},</p>
<p>Nous tenons à vous remercier pour la confiance que vous nous avez accordée lors de {{nom_evenement}}.</p>
<p>Ce fut un plaisir de travailler avec vous. Nous espérons que la prestation a été à la hauteur de vos attentes.</p>
<p>Vos enregistrements sont disponibles sur le Drive qui vous a été communiqué.</p>
<p>N'hésitez pas à nous recommander auprès de votre entourage et à nous faire part de vos retours.</p>
<p>Au plaisir de travailler à nouveau ensemble,<br/>L'équipe Jolof Stream</p>`,
  },
]

export function getTemplateById(id: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id)
}

export const CAMPAIGN_STATUSES = {
  brouillon: { label: "Brouillon", color: "bg-zinc-100 text-zinc-600" },
  planifie: { label: "Planifié", color: "bg-blue-50 text-blue-700" },
  en_cours_envoi: {
    label: "Envoi en cours",
    color: "bg-orange-50 text-orange-700",
  },
  envoye: { label: "Envoyé", color: "bg-green-50 text-green-700" },
  annule: { label: "Annulé", color: "bg-zinc-200 text-zinc-500" },
} as const

export type CampaignStatus = keyof typeof CAMPAIGN_STATUSES

export const CAMPAIGN_STATUS_KEYS = Object.keys(
  CAMPAIGN_STATUSES
) as CampaignStatus[]

export function renderCampaignHtml({
  subject,
  body,
  companyName = "Jolof Stream",
  unsubscribeUrl = "#",
}: {
  subject: string
  body: string
  companyName?: string
  unsubscribeUrl?: string
}): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject || companyName)}</title>
<style>
  body { margin: 0; padding: 24px 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
  .header { background: #C8151B; padding: 20px 28px; color: #ffffff; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
  .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
  .body { padding: 28px; font-size: 14px; line-height: 1.6; color: #3f3f46; }
  .body h2 { font-size: 20px; color: #18181b; margin: 0 0 12px; }
  .body h3 { font-size: 16px; color: #18181b; margin: 16px 0 8px; }
  .body p { margin: 0 0 12px; }
  .body ul { margin: 0 0 12px; padding-left: 20px; }
  .body li { margin-bottom: 4px; }
  .body a { color: #C8151B; }
  .footer { padding: 16px 28px 24px; text-align: center; color: #a1a1aa; font-size: 12px; line-height: 1.5; border-top: 1px solid #e4e4e7; }
  .footer a { color: #71717a; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(companyName)}</h1>
      <p>Captation et diffusion en direct</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>${escapeHtml(companyName)} - Dakar, Senegal</p>
      <p><a href="${unsubscribeUrl}">Se desabonner</a></p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function deriveFirstName(email: string, firstName?: string | null): string {
  if (firstName && firstName.trim()) return firstName.trim()
  const local = email.split("@")[0] ?? ""
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function renderCampaignHtmlWithTracking({
  body,
  subject,
  campaignId,
  contactEmail,
  contactFirstName,
  contactLastName,
  contactToken: token,
  baseUrl,
}: {
  body: string
  subject: string
  campaignId: string
  contactEmail: string
  contactFirstName?: string | null
  contactLastName?: string | null
  // Jeton opaque (lib/marketing-token.ts), calculé côté serveur
  contactToken: string
  baseUrl: string
}): string {
  const cleanBase = baseUrl.replace(/\/+$/, "")
  const prenom = deriveFirstName(contactEmail, contactFirstName)
  const nom = contactLastName?.trim() ?? ""

  // 1) Resolution des variables de personnalisation
  let html = body
    .replace(/\{\{\s*prenom\s*\}\}/g, prenom)
    .replace(/\{\{\s*nom\s*\}\}/g, nom)
    .replace(/\{\{\s*email\s*\}\}/g, contactEmail)

  // 2) Tracking des clics : envelopper chaque <a href="..."> dans un lien de tracking
  html = html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*?)>/gi,
    (match, before, url, after) => {
      if (
        url.startsWith("{{") ||
        url.startsWith("#") ||
        url.startsWith("mailto:") ||
        url.startsWith("tel:")
      ) {
        return match
      }
      const trackedUrl = `${cleanBase}/api/marketing/track/click?campaignId=${campaignId}&t=${token}&url=${encodeURIComponent(url)}`
      return `<a ${before}href="${trackedUrl}"${after}>`
    }
  )

  // 3) Pixel de tracking + bandeau desabonnement
  const pixelUrl = `${cleanBase}/api/marketing/track/open?campaignId=${campaignId}&t=${token}`
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`
  const unsubUrl = `${cleanBase}/api/marketing/unsubscribe?t=${token}`

  const baseHtml = renderCampaignHtml({
    subject,
    body: html,
    unsubscribeUrl: unsubUrl,
  })

  // Insertion du pixel juste avant </body>
  return baseHtml.replace("</body>", `${pixel}</body>`)
}
