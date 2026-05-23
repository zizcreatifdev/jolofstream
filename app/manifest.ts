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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
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
