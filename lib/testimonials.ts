import { z } from "zod"

import { optionalMediaUrlSchema } from "@/lib/site-links"

// Temoignages : regles partagees par l'admin, l'API et le site public

export const TESTIMONIAL_CONTEXTS = ["GENERAL", "FORMATION"] as const
export type TestimonialContextValue = (typeof TESTIMONIAL_CONTEXTS)[number]

export const TESTIMONIAL_CONTEXT_LABELS: Record<TestimonialContextValue, string> = {
  GENERAL: "Général (accueil)",
  FORMATION: "Formation (parcours d'anciens)",
}

export const QUOTE_MAX = 400
export const HOME_TESTIMONIALS_MAX = 6

export const PUBLISH_WITHOUT_CONSENT_MESSAGE =
  "Publication impossible sans l'accord de publication de la personne."

export const testimonialInputSchema = z
  .object({
    quote: z
      .string()
      .trim()
      .min(1, "Citation requise")
      .max(QUOTE_MAX, `${QUOTE_MAX} caractères maximum`),
    authorName: z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum"),
    authorRole: z
      .string()
      .trim()
      .max(120, "120 caractères maximum")
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    photoUrl: optionalMediaUrlSchema,
    context: z.enum(TESTIMONIAL_CONTEXTS),
    consent: z.boolean(),
    published: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.published && !data.consent) {
      ctx.addIssue({
        code: "custom",
        path: ["published"],
        message: PUBLISH_WITHOUT_CONSENT_MESSAGE,
      })
    }
  })

export type TestimonialInput = z.input<typeof testimonialInputSchema>

export type TestimonialView = {
  id: string
  quote: string
  authorName: string
  authorRole: string | null
  photoUrl: string | null
  context: TestimonialContextValue
  consent: boolean
  published: boolean
  order: number
}

export function toTestimonialView(t: TestimonialView): TestimonialView {
  return {
    id: t.id,
    quote: t.quote,
    authorName: t.authorName,
    authorRole: t.authorRole,
    photoUrl: t.photoUrl,
    context: t.context,
    consent: t.consent,
    published: t.published,
    order: t.order,
  }
}

// Initiales affichees sans photo (2 lettres maximum)
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts
  return letters.map((p) => p[0]?.toUpperCase() ?? "").join("")
}
