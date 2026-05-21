import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Jolof Stream | Captation et diffusion en direct",
    template: "%s | Jolof Stream",
  },
  description:
    "Jolof Stream transforme vos evenements en experiences digitales accessibles partout. Dakar, Senegal.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="bg-white font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  )
}
