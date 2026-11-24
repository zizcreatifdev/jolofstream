import type { PrismaClient } from "@prisma/client"

// Fiche du programme RMPD, extraite de la plaquette officielle. Ecrite
// seulement dans des champs vides (jamais d'ecrasement). Source du SQL de la
// migration 20261126120000_v2_p3_programmes_cohortes.
export const RMPD_PROGRAM = {
  slug: "rmpd",
  code: "F-RMPD",
  name: "Réalisation multicam",
  tagline: "De la théorie à la régie.",
  description:
    "Une seule inscription pour trois disciplines : la réalisation, le cadrage et le son. Vous découvrez les outils, vous les manipulez, puis vous réalisez un mini live en conditions réelles.",
  disciplines: ["Réalisation", "Cadrage", "Son"],
  sessionsCount: 5,
  theoryHours: 4,
  practiceHours: 12,
  level: "Aucun prérequis",
  audience:
    "Étudiants, passionnés d'audiovisuel, créateurs de contenus. Aucune expérience requise.",
  objectives: [
    "Comprendre les principes et enjeux de la production audiovisuelle en direct",
    "Utiliser les équipements de captation multicaméra et de régie",
    "Concevoir et préparer un événement ou une émission en direct",
    "Réaliser en équipe une captation live diffusée sur plusieurs plateformes",
    "Assurer la post-production et valoriser les contenus diffusés",
  ],
  curriculum: [
    {
      title: "Découvrir la réalisation multicam",
      mode: "100 % théorique",
      content: [
        "Introduction au live streaming et aux formats de direct (plateau, concert, événement)",
        "Présentation du matériel et des connectiques",
        "Démonstration en plateau test",
      ],
    },
    {
      title: "Préparer un direct",
      mode: "Atelier pratique en équipe",
      content: [
        "Plan de captation, storyboard, repérage du lieu",
        "Préparation de la communication inter-équipe (talkie, signal, rôles)",
        "Atelier : créer le plan technique d'un mini-live",
      ],
    },
    {
      title: "Régie et outils de diffusion",
      mode: "Pratique guidée sur poste",
      content: [
        "Installation et configuration du logiciel de régie (OBS, vMix ou ATEM)",
        "Prise en main des transitions, lower thirds, mixage audio",
        "Simulation d'un live avec caméras, diffusion sur YouTube ou Facebook Live",
      ],
    },
    {
      title: "Production pratique : captation simple",
      mode: "Projet de groupe encadré",
      content: [
        "Répartition des rôles (réalisateur, cadreur, technicien son, habillage)",
        "Captation d'une interview, d'un plateau ou d'une performance",
        "Débrief technique à chaud",
      ],
    },
    {
      title: "Production pratique : mini live",
      mode: "Projet de groupe encadré",
      content: ["Réalisation d'un mini live en conditions réelles", "Débrief technique à chaud"],
    },
  ],
  stats: [
    { value: "06", label: "cohortes réalisées" },
    { value: "90", label: "personnes formées" },
    { value: "+80 %", label: "ont déjà participé à une production multicam" },
  ],
  leadName: "Serigne Khadim Diouf",
  leadRole: "Réalisateur multicam, à l'initiative de la formation",
  contactEmail: "formation@jolofstream.com",
  contactPhone: "+221 78 241 49 49",
  brochureTitle: "La formation RMPD",
  brochureFileName: "Jolof-Stream-Formation-RMPD.pdf",
}

const SCALAR_FIELDS = [
  "code",
  "tagline",
  "description",
  "sessionsCount",
  "theoryHours",
  "practiceHours",
  "level",
  "audience",
  "leadName",
  "leadRole",
  "contactEmail",
  "contactPhone",
  "brochureTitle",
  "brochureFileName",
] as const

function isEmptyJson(value: unknown): boolean {
  return value === null || (Array.isArray(value) && value.length === 0)
}

// Meme logique que la migration : 0 programme, creation ; 1 programme,
// remplissage des champs vides ; plusieurs, rien
export async function seedFormations(prisma: PrismaClient) {
  const programs = await prisma.trainingProgram.findMany()
  if (programs.length === 0) {
    await prisma.trainingProgram.create({ data: { id: "prog_rmpd", ...RMPD_PROGRAM } })
  } else if (programs.length === 1) {
    const p = programs[0]
    const data: Record<string, unknown> = {}
    for (const field of SCALAR_FIELDS) {
      const current = p[field]
      if (current === null || current === "") data[field] = RMPD_PROGRAM[field]
    }
    if (p.disciplines.length === 0) data.disciplines = RMPD_PROGRAM.disciplines
    if (p.objectives.length === 0) data.objectives = RMPD_PROGRAM.objectives
    if (isEmptyJson(p.curriculum)) data.curriculum = RMPD_PROGRAM.curriculum
    if (isEmptyJson(p.stats)) data.stats = RMPD_PROGRAM.stats
    if (Object.keys(data).length > 0) {
      await prisma.trainingProgram.update({ where: { id: p.id }, data })
    }
  }
  const rmpd = await prisma.trainingProgram.findFirst({
    where: { OR: [{ code: "F-RMPD" }, { slug: "rmpd" }] },
  })
  if (rmpd) {
    await prisma.testimonial.updateMany({
      where: { id: { startsWith: "tm_alumni_" }, programId: null },
      data: { programId: rmpd.id },
    })
  }
  console.log("Seed formations termine (fiche RMPD)")
}
