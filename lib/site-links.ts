import { z } from "zod"

// Lien d'un bouton du site : interne ("/contact", "/services#offres") ou https
export const hrefSchema = z
  .string()
  .trim()
  .min(1, "Lien requis")
  .refine(
    (v) => /^\/(?!\/)/.test(v) || /^https:\/\/\S+$/i.test(v),
    "Lien interne commencant par / ou adresse https"
  )

// Meme regle, champ facultatif : vide ou absent donne null
export const optionalHrefSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  hrefSchema.nullable().optional()
)

// URL https d'un media televerse, facultative
export const optionalMediaUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/\S+$/i.test(v), "Adresse https attendue")
