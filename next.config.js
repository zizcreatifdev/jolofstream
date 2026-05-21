/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jzazuschinxqcbyrotsd.supabase.co",
      },
    ],
  },
}

module.exports = nextConfig
