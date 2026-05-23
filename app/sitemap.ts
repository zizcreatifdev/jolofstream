import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/formations`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]

  let portfolioPages: MetadataRoute.Sitemap = []
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    })
    portfolioPages = items.map((item) => ({
      url: `${baseUrl}/portfolio/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // DB inaccessible : on retombe sur le sitemap statique uniquement
  }

  let formationPages: MetadataRoute.Sitemap = []
  try {
    const sessions = await prisma.trainingSession.findMany({
      where: { status: "ouvert" },
      select: { id: true, updatedAt: true },
    })
    formationPages = sessions.map((session) => ({
      url: `${baseUrl}/formations/${session.id}`,
      lastModified: session.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch {
    // DB inaccessible
  }

  return [...staticPages, ...portfolioPages, ...formationPages]
}
