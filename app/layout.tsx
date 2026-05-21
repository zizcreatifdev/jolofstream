import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Jolof Stream",
  description: "Captation et diffusion en direct d'evenements - Dakar",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
