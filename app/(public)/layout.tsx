import { getSiteContact } from "@/lib/site-settings"
import { SiteChrome } from "@/components/public/site/site-chrome"
import { SiteFooter } from "@/components/public/site/site-footer"
import { PwaRegister } from "@/components/public/pwa-register"
import { PwaInstallPrompt } from "@/components/public/pwa-install-prompt"

// Coordonnees du pied de page et du menu relues au plus toutes les 60 s
export const revalidate = 60

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const contact = await getSiteContact()
  return (
    <div className="cine bg-cream font-sans text-ink antialiased">
      <SiteChrome contact={contact}>
        <main id="contenu" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter contact={contact} />
      </SiteChrome>
      <PwaRegister />
      <PwaInstallPrompt />
    </div>
  )
}
