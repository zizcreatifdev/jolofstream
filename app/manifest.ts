import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jolof Stream",
    short_name: "JolofStream",
    description: "Captation et diffusion en direct - Dakar, Senegal",
    start_url: "/",
    display: "standalone",
    background_color: "#161110",
    theme_color: "#C8151B",
    lang: "fr",
    icons: [
      {
        src: "/logos/Logo_JolofStream_couleur.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  }
}
