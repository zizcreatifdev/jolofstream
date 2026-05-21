import { z } from "zod"

export const trainingRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, "Prenom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(6, "Telephone requis"),
  sessionId: z.string().trim().min(1, "Session requise"),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type TrainingRegistrationInput = z.infer<typeof trainingRegistrationSchema>

export const quoteRequestSchema = z.object({
  firstName: z.string().trim().min(1, "Prenom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(6, "Telephone requis"),
  organization: z.string().trim().min(1, "Organisation requise"),
  serviceType: z.enum(
    [
      "captation-streaming-live",
      "ceo-content-package",
      "creator-weekend",
      "gestion-reseaux",
      "autre",
    ],
    { message: "Type de service requis" }
  ),
  desiredDate: z.string().trim().min(1, "Date souhaitee requise"),
  location: z.string().trim().min(1, "Lieu requis"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
})

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>

export const trainingSessionSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  dateStart: z.string().trim().min(1, "Date de debut requise"),
  dateEnd: z.string().trim().min(1, "Date de fin requise"),
  location: z.string().trim().min(1, "Lieu requis"),
  maxSeats: z.coerce.number().int().positive("Nombre de places requis"),
  price: z.coerce.number().positive("Prix requis"),
  description: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ouvert", "complet", "annule"]).default("ouvert"),
})

export type TrainingSessionInput = z.infer<typeof trainingSessionSchema>

export const serviceTypeLabels: Record<
  QuoteRequestInput["serviceType"],
  string
> = {
  "captation-streaming-live": "Captation & Streaming Live",
  "ceo-content-package": "CEO Content Package",
  "creator-weekend": "Creator Weekend",
  "gestion-reseaux": "Gestion publication reseaux",
  autre: "Autre",
}
