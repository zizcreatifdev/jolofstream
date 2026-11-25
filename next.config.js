// Hôte Supabase du projet (Storage), quel que soit l'environnement
const supabaseUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  } catch {
    return null
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", ""),
              hostname: supabaseUrl.hostname,
              ...(supabaseUrl.port ? { port: supabaseUrl.port } : {}),
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "jzazuschinxqcbyrotsd.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // SAMEORIGIN : l'aperçu interne (PDF, pages) reste possible, aucun site tiers
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Pas de CSP stricte (lecteurs YouTube, Supabase) ; capteurs désactivés
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
