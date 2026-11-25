import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OFFER_SERVICE_TYPES, type OfferServiceType } from "@/lib/offers"
import { OFFER_PATHS, revalidateSite } from "@/lib/revalidate-site"

const offerSchema = z.object({
  serviceType: z.enum(OFFER_SERVICE_TYPES),
  name: z.string().trim().min(1, "Nom requis"),
  price: z.number().nonnegative().nullable().optional(),
  priceLabel: z.string().trim().optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1)).min(1, "Au moins une fonctionnalité"),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
})

type OfferOut = {
  id: string
  serviceType: string
  name: string
  price: number | null
  priceLabel: string | null
  features: string[]
  isPopular: boolean
  displayOrder: number
  active: boolean
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    const offers = await prisma.offer.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: [{ serviceType: "asc" }, { displayOrder: "asc" }],
    })

    const grouped = Object.fromEntries(
      OFFER_SERVICE_TYPES.map((t) => [t, [] as OfferOut[]])
    ) as Record<OfferServiceType, OfferOut[]>

    for (const o of offers) {
      if (!(OFFER_SERVICE_TYPES as readonly string[]).includes(o.serviceType)) continue
      grouped[o.serviceType as OfferServiceType].push({
        id: o.id,
        serviceType: o.serviceType,
        name: o.name,
        price: o.price,
        priceLabel: o.priceLabel,
        features: o.features,
        isPopular: o.isPopular,
        displayOrder: o.displayOrder,
        active: o.active,
      })
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error("[api/catalogue GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = offerSchema.parse(body)

    const offer = await prisma.offer.create({
      data: {
        serviceType: data.serviceType,
        name: data.name,
        price: data.price ?? null,
        priceLabel: data.priceLabel || null,
        features: data.features,
        isPopular: data.isPopular,
        displayOrder: data.displayOrder,
        active: data.active,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Offer",
        entityId: offer.id,
        description: `Offre créée : ${offer.name}`,
      },
    })

    revalidateSite(OFFER_PATHS)
    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/catalogue POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
