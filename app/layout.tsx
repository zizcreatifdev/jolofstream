import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"
  ),
  title: {
    default: "Jolof Stream | Captation et diffusion en direct",
    template: "%s | Jolof Stream",
  },
  description:
    "Jolof Stream transforme vos événements en expériences digitales accessibles partout. Captation multi-caméras HD, streaming multi-plateformes, CEO Content Package. Dakar, Sénégal.",
  keywords: [
    "streaming live",
    "captation vidéo",
    "diffusion en direct",
    "streaming Dakar",
    "événement Sénégal",
    "CEO content",
    "creator weekend",
    "production vidéo Dakar",
  ],
  authors: [{ name: "Jolof Stream" }],
  creator: "Jolof Stream",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jolof Stream",
  },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: "https://jolofstream.com",
    siteName: "Jolof Stream",
    title: "Jolof Stream | Captation et diffusion en direct",
    description:
      "Jolof Stream transforme vos événements en expériences digitales accessibles partout.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Jolof Stream - Captation et diffusion en direct",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jolof Stream | Captation et diffusion en direct",
    description:
      "Captation multi-caméras HD et streaming multi-plateformes. Dakar, Sénégal.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

// Etiquettes techniques et timecode du site public (variable --font-mono)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono",
})

// Polices du site auto-hébergées par next/font : préchargées, métriques de
// repli ajustées (pas de décalage du hero au chargement, P6 F1)
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bricolage",
})
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
})

export const viewport: Viewport = {
  themeColor: "#C8151B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <html
      lang="fr"
      className={`${jetbrainsMono.variable} ${bricolage.variable} ${instrumentSerif.variable}`}
    >
      <body className="bg-white font-sans text-zinc-900 antialiased">
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
