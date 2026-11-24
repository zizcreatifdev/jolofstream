import { z } from "zod"

// Programmes de formation : regles partagees par l'admin, l'API et le site

export const MAX_DISCIPLINES = 6
export const MAX_OBJECTIVES = 8
export const MAX_CURRICULUM = 12
export const MAX_CURRICULUM_CONTENT = 6
export const MAX_STATS = 4

// Delai de paiement d'une reservation (parametre training_payment_delay_hours)
export const PAYMENT_DELAY_DEFAULT = 48
export const PAYMENT_DELAY_MIN = 24
export const PAYMENT_DELAY_MAX = 168

export function parsePaymentDelay(value: string | null | undefined): number {
  const n = Number.parseInt(String(value ?? ""), 10)
  if (!Number.isFinite(n)) return PAYMENT_DELAY_DEFAULT
  return Math.min(PAYMENT_DELAY_MAX, Math.max(PAYMENT_DELAY_MIN, n))
}

// Slug ASCII en minuscules avec tirets (meme regle que la migration SQL)
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "formation"
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

const positiveInt = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0), "Nombre entier positif attendu")

const positiveAmount = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Montant positif attendu")

const listItem = (max: number, label: string) =>
  z.string().trim().min(1, `${label} vide`).max(max, `${max} caractères maximum`)

export const curriculumItemSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(120, "120 caractères maximum"),
  mode: z.string().trim().max(80, "80 caractères maximum").default(""),
  content: z
    .array(listItem(240, "Contenu"))
    .max(MAX_CURRICULUM_CONTENT, `${MAX_CURRICULUM_CONTENT} contenus maximum`),
})

export const statItemSchema = z.object({
  value: z.string().trim().min(1, "Valeur requise").max(12, "12 caractères maximum"),
  label: z.string().trim().min(1, "Libellé requis").max(80, "80 caractères maximum"),
})

export const curriculumSchema = z
  .array(curriculumItemSchema)
  .max(MAX_CURRICULUM, `${MAX_CURRICULUM} séances maximum`)
export const statsSchema = z.array(statItemSchema).max(MAX_STATS, `${MAX_STATS} chiffres clés maximum`)

export type CurriculumItem = z.output<typeof curriculumItemSchema>
export type StatItem = z.output<typeof statItemSchema>

export const programInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Adresse requise")
    .max(80, "80 caractères maximum")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Minuscules, chiffres et tirets uniquement"),
  code: text(20),
  name: z.string().trim().min(1, "Nom requis").max(120, "120 caractères maximum"),
  tagline: text(120),
  description: text(800),
  disciplines: z
    .array(listItem(60, "Discipline"))
    .max(MAX_DISCIPLINES, `${MAX_DISCIPLINES} disciplines maximum`)
    .default([]),
  sessionsCount: positiveInt,
  theoryHours: positiveInt,
  practiceHours: positiveInt,
  level: text(80),
  audience: text(300),
  objectives: z
    .array(listItem(200, "Objectif"))
    .max(MAX_OBJECTIVES, `${MAX_OBJECTIVES} objectifs maximum`)
    .default([]),
  curriculum: curriculumSchema.default([]),
  stats: statsSchema.default([]),
  leadName: text(80),
  leadRole: text(120),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Email invalide"),
  contactPhone: text(30),
  defaultPrice: positiveAmount,
  defaultMaxSeats: positiveInt,
  published: z.boolean().default(true),
})

export type ProgramInput = z.input<typeof programInputSchema>
export type ProgramParsed = z.output<typeof programInputSchema>

// Lecture tolerante des colonnes JSON (curriculum, stats)
export function readCurriculum(value: unknown): CurriculumItem[] {
  const parsed = curriculumSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}

export function readStats(value: unknown): StatItem[] {
  const parsed = statsSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}

// Plaquette PDF : metadonnees modifiables
export const brochureMetaSchema = z.object({
  brochureTitle: text(120),
  brochureFileName: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || /^[A-Za-z0-9][A-Za-z0-9._-]{0,118}\.pdf$/.test(v),
      "Nom de fichier en .pdf, sans espace ni accent"
    ),
  brochurePages: positiveInt,
  brochurePublished: z.boolean().optional(),
})

export const BROCHURE_MAX_BYTES = 10 * 1024 * 1024

// Lien public stable de la plaquette
export function brochurePublicPath(slug: string): string {
  return `/formations/${slug}/plaquette`
}
