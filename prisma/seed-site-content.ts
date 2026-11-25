import type { PrismaClient } from "@prisma/client"

import { FORMATIONS_PAGE_DEFAULT, type SiteContentMap } from "../lib/site-content"

// Contenu initial de l'accueil et de la page Services (refonte V2, prompt 2).
// Textes de la maquette ; services migres de l'ancienne page (accents
// corriges) et completes par la maquette. Identique au SQL de la migration
// 20261125120000_v2_p2_home_services_testimonials (genere depuis ce fichier).
export const SITE_CONTENT_SEED: SiteContentMap = {
  home_manifesto: {
    kicker: "Manifeste",
    text: "Nous ne branchons pas des câbles. *Nous captons l’émotion* d’un instant et nous l’envoyons partout dans le monde, **en direct,** pendant que vous vivez le vôtre.",
  },
  home_skills: {
    kicker: "Savoir-faire",
    title: "Six métiers,",
    titleAccent: "un seul direct.",
    items: [
      {
        title: "Captation multi-caméras HD",
        description:
          "Chaque caméra est placée pour capter l’essence de l’événement : plans larges, gros plans, réactions du public. Notre régie mobile passe d’un angle à l’autre en temps réel.",
        imageUrl: null,
      },
      {
        title: "Streaming simultané",
        description:
          "YouTube, Facebook et Zoom en même temps, sans compromis sur la qualité. Votre audience vous suit là où elle se trouve.",
        imageUrl: null,
      },
      {
        title: "Habillage graphique",
        description:
          "Titres, bandeaux, transitions : une identité visuelle 100 % personnalisée, fidèle à votre univers, intégrée à la régie.",
        imageUrl: null,
      },
      {
        title: "Modération des chats",
        description:
          "Un espace d’échange sain et respectueux pendant le live. Vos spectateurs se sentent écoutés et participent davantage.",
        imageUrl: null,
      },
      {
        title: "Enregistrement par caméra",
        description:
          "Chaque angle est enregistré séparément en Full HD : replays, highlights, teasers et contenus réseaux sans perte de qualité.",
        imageUrl: null,
      },
      {
        title: "Support technique de A à Z",
        description:
          "Du premier test au dernier plan, nous gérons toute la technique. Vous vous concentrez sur votre événement.",
        imageUrl: null,
      },
    ],
  },
  home_final_cta: {
    marquee: "Votre prochain *direct*",
    text: "Dites-nous ce que vous préparez. Devis détaillé sous 24h, partout au Sénégal et dans la sous-région.",
    cta1Label: "Demander un devis",
    cta1Href: "/contact",
  },
  home_sections: {
    worksKicker: "Réalisations",
    worksTitle: "Ce qu’on a",
    worksTitleAccent: "capté.",
    worksText: "Faites défiler : chaque plan est un événement diffusé en direct.",
    offersKicker: "Offres",
    offersTitle: "Trois façons de",
    offersTitleAccent: "passer à l’écran.",
    formationsTitle: "Passez derrière la caméra",
    formationsText:
      "Sessions pratiques en petit groupe, sur notre matériel. Choisissez votre cohorte, payez ensuite par lien Wave Business reçu par email.",
    testimonialsKicker: "Témoignages",
    testimonialsTitle: "Ils nous ont",
    testimonialsTitleAccent: "confié leur direct.",
  },
  services_content: {
    live: {
      kicker: "Diffusion en direct",
      title: "Captation et",
      titleAccent: "streaming live",
      intro:
        "Production HD multi-caméras et diffusion en direct sur toutes les plateformes : YouTube, Facebook, LinkedIn, sites privés. Régie complète et équipe expérimentée.",
      included: [
        "Captation 2 à 4 caméras HD ou 4K",
        "Régie multi-sources avec habillage graphique",
        "Diffusion multi-plateformes simultanée",
        "Enregistrement complet et replay archivé",
        "Modération des chats et commentaires",
        "Support technique de A à Z",
      ],
      steps: [
        {
          title: "Briefing et préparation",
          description: "On comprend l’événement et l’audience. Devis sous 24h.",
        },
        {
          title: "Installation sur site",
          description: "Repérage, setup, essais son et image, plateformes connectées.",
        },
        {
          title: "Diffusion en direct",
          description: "Réalisation, modération des chats, diffusion simultanée.",
        },
        {
          title: "Livraison des masters",
          description: "Replay et fichiers de chaque caméra en Full HD.",
        },
      ],
    },
    ceo: {
      kicker: "Image de marque",
      title: "CEO",
      titleAccent: "Content",
      intro:
        "Construisez votre image de dirigeant avec des contenus vidéo professionnels mensuels. Format clé en main, du tournage à la publication.",
      included: [
        "Sessions de tournage mensuelles",
        "Capsules vidéo montées et sous-titrées",
        "Coaching de prise de parole",
        "Publication réseaux optionnelle",
        "Déplacement avec setup complet",
        "Caméras, lumière et son professionnels",
        "Livraison Drive ou WeTransfer",
      ],
      steps: [
        {
          title: "Consultation mensuelle",
          description: "Sujets, formats, ton : on prépare ensemble.",
        },
        {
          title: "Tournage",
          description: "Session chez vous, setup installé en moins d’une heure.",
        },
        {
          title: "Montage et livraison",
          description: "Formats courts et longs, sous-titrés, livrés par lien privé.",
        },
        {
          title: "Publication optionnelle",
          description: "Sur vos réseaux, au bon format et au bon moment.",
        },
      ],
    },
    creator: {
      kicker: "Production intensive",
      title: "Creator",
      titleAccent: "Weekend",
      intro:
        "Un week-end entier dédié à la création de votre contenu. Tournage intensif, montage et livraison de tous les livrables en une session.",
      included: [
        "2 jours de tournage intensif",
        "10 à 30 livrables prêts à publier",
        "Studio mobile avec éclairage cinéma",
        "Coaching de cadrage et lumière",
        "Réalisation de votre concept",
        "Habillage à votre image",
        "Livraison sous 5 jours",
      ],
      steps: [
        {
          title: "Préparation du concept",
          description: "Idées, références, nombre de vidéos visées.",
        },
        {
          title: "Tournage 2 jours",
          description: "Samedi et dimanche : installation, tournages, plans complémentaires.",
        },
        {
          title: "Montage",
          description: "Montage tous formats, habillage à votre image.",
        },
        {
          title: "Livraison",
          description: "Vidéos montées, prêtes à publier, sous cinq jours.",
        },
      ],
    },
    social: {
      kicker: "Add-on",
      title: "Publication",
      titleAccent: "réseaux",
      intro:
        "Confiez-nous la diffusion de vos contenus sur Instagram, Facebook, LinkedIn et TikTok. En option sur toutes nos productions, au bon format et au bon moment.",
      included: [
        "Stratégie éditoriale mensuelle",
        "Formats par plateforme",
        "Programmation et publication",
        "Reporting des performances",
        "Calendrier de publication",
        "Rédaction des légendes",
      ],
      steps: [],
    },
  },
  formations_page: FORMATIONS_PAGE_DEFAULT,
  contact_page: {
    kicker: "Scène 06 · Contact",
    title: "Parlons de",
    titleAccent: "votre projet.",
    lead: "Trois étapes, une minute. Votre demande arrive directement chez nous et vous recevez un devis détaillé sous 24h.",
    zoneText:
      "Nous intervenons partout au Sénégal et dans la sous-région. Les frais de déplacement sont intégrés au devis.",
    successTitle: "C’est *dans la boîte.*",
    successText:
      "Un accusé de réception part par email. Notre équipe revient vers vous sous 24h avec un devis détaillé.",
  },
  portfolio_page: {
    kicker: "Scène 04 · Portfolio",
    title: "Ce qu’on a capté,",
    titleAccent: "ce qu’on a diffusé.",
    lead: "Événements, productions pour dirigeants, week-ends créateurs, formations. Cliquez sur une réalisation pour la voir.",
    finalMarquee: "Le prochain, *c’est vous*",
    finalText: "Votre événement mérite sa place ici.",
    finalCtaLabel: "Réserver une date",
  },
  about_page: {
    kicker: "Scène 05 · À propos",
    title: "Qui nous",
    titleAccent: "sommes.",
    lead: "Jolof Stream est une société spécialisée dans la captation et la diffusion en direct d’événements sur le web. Nous associons expertise technique et sensibilité multiculturelle pour offrir à vos événements une portée qui dépasse les frontières.",
  },
  faq_items: [
    {
      question: "Vous fournissez la connexion internet sur place ?",
      answer:
        "Nous testons la connexion du lieu lors du repérage. Selon la formule, nous ajoutons une connexion 4G/5G de secours. Pour les grandes diffusions, nous préparons avec vous une liaison filaire dédiée.",
    },
    {
      question: "Peut-on diffuser sur plusieurs plateformes en même temps ?",
      answer:
        "Oui. Notre système de diffusion simultanée envoie votre direct sur YouTube, Facebook et Zoom en même temps, sans perte de qualité.",
    },
    {
      question: "Est-ce qu’on récupère les vidéos après le live ?",
      answer:
        "Toujours. Chaque caméra est enregistrée séparément en Full HD : vous pouvez remonter l’événement, créer des extraits, des teasers ou des replays.",
    },
    {
      question: "Comment se passe le paiement ?",
      answer:
        "Pour les services, un devis est validé avant toute prestation, avec un acompte selon le projet. Paiement par Wave Business ou virement. Pour les formations, vous recevez un lien Wave Business par email après inscription.",
    },
    {
      question: "Quels délais de livraison ?",
      answer:
        "48h pour le replay d’un événement, 5 jours ouvrés pour un Creator Weekend, et selon le forfait pour le CEO Content. La livraison se fait par lien privé Drive ou WeTransfer.",
    },
    {
      question: "Vous intervenez en dehors de Dakar ?",
      answer: "Oui, partout au Sénégal et dans la sous-région. Les frais de déplacement sont intégrés au devis.",
    },
    {
      question: "Quels types d’événements couvrez-vous ?",
      answer:
        "Nous couvrons tous types d’événements : conférences, galas, mariages, événements d’entreprise, formations, concerts. Si vous avez un projet spécifique, contactez-nous.",
    },
    {
      question: "Proposez-vous des forfaits pour les associations et ONG ?",
      answer:
        "Oui, nous proposons des tarifs adaptés pour les associations, ONG et structures éducatives. Mentionnez-le dans votre demande de devis.",
    },
  ],
  services_page: {
    kicker: "Scène 02 · Services",
    title: "Des prestations",
    titleAccent: "sur mesure.",
    lead: "Du direct multi-caméras à la production de contenu chez vous : quatre offres, une même exigence technique.",
    finalMarquee: "On s’occupe *de tout*",
    finalText:
      "Un projet qui ne rentre dans aucune case ? Parlons-en, on construit la formule avec vous.",
  },
}

// Parcours d'anciens de la formation : brouillons, accord a obtenir
export const FORMATION_TESTIMONIALS_SEED = [
  {
    id: "tm_alumni_arame_diaw",
    authorName: "Arame Diaw",
    authorRole: "Réalisatrice TV",
    quote:
      "Venue du design, elle est devenue l'une des cadreuses les plus sollicitées de l'université, surnommée Mrs CAM 1. Elle réalise aujourd'hui la plupart des plateaux d'une chaîne de télévision.",
  },
  {
    id: "tm_alumni_diama_gueye",
    authorName: "Diama Gueye",
    authorRole: "Réalisatrice, Solo Média Groupe",
    quote:
      "Elle a découvert la réalisation multicam chez Jolof Stream. Depuis, elle a réalisé la première cérémonie de graduation de l'UGB et de nombreux événements.",
  },
  {
    id: "tm_alumni_khassime_niang",
    authorName: "Khassime Niang",
    authorRole: "Réalisateur",
    quote:
      "Après la formation, il s'est affirmé comme réalisateur, avec une ambition claire : multiplier les expériences et explorer de nouveaux horizons.",
  },
]

export async function seedSiteContent(prisma: PrismaClient) {
  for (const [key, value] of Object.entries(SITE_CONTENT_SEED)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    })
  }
  const formationCount = await prisma.testimonial.count({
    where: { context: "FORMATION" },
  })
  if (formationCount === 0) {
    await prisma.testimonial.createMany({
      data: FORMATION_TESTIMONIALS_SEED.map((t, order) => ({
        ...t,
        context: "FORMATION" as const,
        consent: false,
        published: false,
        order,
      })),
    })
  }
  console.log("Seed contenus du site termine (accueil, services, parcours d'anciens)")
}
