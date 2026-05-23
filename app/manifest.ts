import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jolof Stream",
    short_name: "JolofStream",
    description: "Captation et diffusion en direct - Dakar, Senegal",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#C8151B",
    theme_color: "#C8151B",
    lang: "fr",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/logos/Jolof_logo_icon_FRouge.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logos/Jolof_logo_icon_FRouge.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/Jolof_logo_icon_FRouge.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  }
}
