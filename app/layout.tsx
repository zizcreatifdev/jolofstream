import type { Metadata, Viewport } from "next"
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
    "Jolof Stream transforme vos evenements en experiences digitales accessibles partout. Captation multi-cameras HD, streaming multi-plateformes, CEO Content Package. Dakar, Senegal.",
  keywords: [
    "streaming live",
    "captation video",
    "diffusion en direct",
    "streaming Dakar",
    "evenement Senegal",
    "CEO content",
    "creator weekend",
    "production video Dakar",
  ],
  authors: [{ name: "Jolof Stream" }],
  creator: "Jolof Stream",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logos/Jolof_logo_icon_FRouge.png", type: "image/png" },
    ],
    apple: [
      {
        url: "/logos/Jolof_logo_icon_FRouge.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
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
      "Jolof Stream transforme vos evenements en experiences digitales accessibles partout.",
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
      "Captation multi-cameras HD et streaming multi-plateformes. Dakar, Senegal.",
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
    <html lang="fr">
      <body className="bg-white font-sans text-zinc-900 antialiased">
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
