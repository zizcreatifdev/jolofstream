import { PrismaClient } from "@prisma/client"

const defaultOffers = [
  {
    serviceType: "ceo_content",
    name: "Forfait Essentiel",
    price: null,
    priceLabel: "par mois",
    features: [
      "Séance mensuelle de tournage (2h)",
      "4 à 6 vidéos courtes montées (Reels/Shorts)",
      "1 vidéo longue format (LinkedIn/YouTube)",
      "Habillage graphique aux couleurs du client",
      "Sous-titrage inclus",
      "Livraison via Drive privé dédié",
      "Publication sur ses réseaux incluse",
    ],
    isPopular: false,
    displayOrder: 1,
    active: true,
  },
  {
    serviceType: "ceo_content",
    name: "Forfait Premium",
    price: null,
    priceLabel: "par mois",
    features: [
      "Tout le Forfait Essentiel",
      "2 séances mensuelles de tournage",
      "8 à 12 vidéos courtes",
      "2 vidéos longues format",
      "Reportage événementiel mensuel",
      "Stratégie éditoriale mensuelle",
      "Sous-titrage + versions multilingues",
      "Publication sur tous les réseaux",
    ],
    isPopular: true,
    displayOrder: 2,
    active: true,
  },
  {
    serviceType: "creator_weekend",
    name: "Weekend Solo",
    price: null,
    priceLabel: "par session",
    features: [
      "Déplacement chez le client (Dakar)",
      "2 jours de tournage sur site",
      "1 caméra + éclairage + son professionnel",
      "6 à 10 vidéos courtes montées",
      "1 vidéo longue format",
      "Livraison via Drive ou WeTransfer",
      "Publication réseaux en option",
    ],
    isPopular: false,
    displayOrder: 1,
    active: true,
  },
  {
    serviceType: "creator_weekend",
    name: "Weekend Collab",
    price: null,
    priceLabel: "par session",
    features: [
      "Tout le Weekend Solo",
      "2 créateurs simultanés",
      "Setup studio professionnel",
      "Éclairage cinéma",
      "12 à 20 vidéos courtes",
      "2 vidéos longues format",
      "Séance photos incluse",
    ],
    isPopular: true,
    displayOrder: 2,
    active: true,
  },
]

export async function seedCatalogue(prisma: PrismaClient) {
  for (const offer of defaultOffers) {
    const existing = await prisma.offer.findFirst({
      where: { serviceType: offer.serviceType, name: offer.name },
    })
    if (existing) {
      await prisma.offer.update({
        where: { id: existing.id },
        data: offer,
      })
    } else {
      await prisma.offer.create({ data: offer })
    }
  }
  console.log("Seed catalogue termine : 4 offres par defaut")
}
