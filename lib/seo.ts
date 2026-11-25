import type { Metadata } from "next"

// Domaine canonique de production : les URL canoniques et Open Graph pointent
// toujours vers lui, quel que soit l'environnement (préproduction, local).
export const CANONICAL_ORIGIN = "https://jolofstream.com"

const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Jolof Stream, captation et diffusion en direct",
}

// Métadonnées d'une page publique : titre, description, canonical, Open Graph
// et carte Twitter cohérents. `title` est le titre court (le gabarit ajoute
// « | Jolof Stream »), sauf `absoluteTitle` pour l'accueil.
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
}: {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  index?: boolean
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | Jolof Stream`
  const url = `${CANONICAL_ORIGIN}${path === "/" ? "" : path}` || CANONICAL_ORIGIN
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_SN",
      siteName: "Jolof Stream",
      url,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  }
}
