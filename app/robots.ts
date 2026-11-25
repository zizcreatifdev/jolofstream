import type { MetadataRoute } from "next"

import { CANONICAL_ORIGIN } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = CANONICAL_ORIGIN

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
