import type { PrismaClient } from "@prisma/client"

// Slides initiales du hero (reprises de la maquette V2 Cinema, sans video).
// Inserees seulement si la table est vide : identiques au SQL de la migration
// 20261124120000_hero_slides.
export async function seedHeroSlides(prisma: PrismaClient) {
  const count = await prisma.heroSlide.count()
  if (count > 0) return
  await prisma.heroSlide.createMany({
    data: [
      {
        id: "hero_showreel",
        order: 0,
        active: true,
        kicker: "Showreel 2026 · Captation et streaming",
        titleLine1: "Capturez l’instant,",
        titleLine2: "diffusez l’émotion.",
        accentText: "diffusez",
        description:
          "Multi-caméras Full HD, régie mobile, habillage à vos couleurs. Votre événement part en direct sur YouTube, Facebook et Zoom, partout dans le monde.",
        videoType: "NONE",
        cta1Label: "Demander un devis",
        cta1Href: "/contact",
        cta2Label: "Nos services",
        cta2Href: "/services",
        soundLabel: "Regarder avec le son",
      },
      {
        id: "hero_formations",
        order: 1,
        active: true,
        kicker: "Formations · Places limitées",
        titleLine1: "Passez derrière",
        titleLine2: "la caméra.",
        accentText: "la caméra.",
        description:
          "Sessions pratiques en petit groupe sur notre matériel professionnel. Vous repartez capable de capter et diffuser un événement en direct.",
        videoType: "NONE",
        cta1Label: "Réserver ma place",
        cta1Href: "/formations/reserver",
        cta2Label: "Voir les sessions",
        cta2Href: "/formations",
        soundLabel: "Voir la vidéo formations",
        badgeText: "Prochaine cohorte | {prochaine-cohorte}",
      },
    ],
  })
  console.log("Seed hero termine : 2 slides inserees")
}
