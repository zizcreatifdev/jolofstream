import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com"
  const now = new Date()

  // /formations : derniere mise a jour d'un programme ou d'une cohorte.
  // Le tunnel /formations/reserver n'est pas indexe.
  let formationsUpdated = now
  try {
    const [program, cohort] = await Promise.all([
      prisma.trainingProgram.aggregate({ _max: { updatedAt: true }, where: { published: true } }),
      prisma.trainingSession.aggregate({ _max: { updatedAt: true } }),
    ])
    const dates = [program._max.updatedAt, cohort._max.updatedAt].filter((d): d is Date => Boolean(d))
    if (dates.length) formationsUpdated = new Date(Math.max(...dates.map((d) => d.getTime())))
  } catch {
    // DB inaccessible : date du jour
  }

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
      lastModified: formationsUpdated,
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

  return [...staticPages, ...portfolioPages]
}
