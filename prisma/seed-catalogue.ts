import { PrismaClient } from "@prisma/client"

const defaultOffers = [
  {
    serviceType: "ceo_content",
    name: "Forfait Essentiel",
    price: null,
    priceLabel: "par mois",
    features: [
      "Seance mensuelle de tournage (2h)",
      "4 a 6 videos courtes montees (Reels/Shorts)",
      "1 video longue format (LinkedIn/YouTube)",
      "Habillage graphique aux couleurs du client",
      "Sous-titrage inclus",
      "Livraison via Drive prive dedie",
      "Publication sur ses reseaux incluse",
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
      "2 seances mensuelles de tournage",
      "8 a 12 videos courtes",
      "2 videos longues format",
      "Reportage evenementiel mensuel",
      "Strategie editoriale mensuelle",
      "Sous-titrage + versions multilingues",
      "Publication sur tous les reseaux",
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
      "Deplacement chez le client (Dakar)",
      "2 jours de tournage sur site",
      "1 camera + eclairage + son professionnel",
      "6 a 10 videos courtes montees",
      "1 video longue format",
      "Livraison via Drive ou WeTransfer",
      "Publication reseaux en option",
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
      "2 createurs simultanes",
      "Setup studio professionnel",
      "Eclairage cinema",
      "12 a 20 videos courtes",
      "2 videos longues format",
      "Seance photos incluse",
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
