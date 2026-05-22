import { Navbar } from "@/components/public/navbar"
import { Footer } from "@/components/public/footer"

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
    </div>
  )
}
