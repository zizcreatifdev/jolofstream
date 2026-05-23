import { Navbar } from "@/components/public/navbar"
import { Footer } from "@/components/public/footer"
import { PwaRegister } from "@/components/public/pwa-register"
import { PwaInstallPrompt } from "@/components/public/pwa-install-prompt"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <PwaRegister />
      <PwaInstallPrompt />
    </div>
  )
}
