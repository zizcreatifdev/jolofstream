import { z } from "zod"

import { PHONE_ERROR, normalizePhone } from "@/lib/phone"

// Reservation d'une place (tunnel public et ajout manuel admin). Telephone
// obligatoire, normalise en +XXXXXXXXX (lib/phone.ts). "website" est le
// champ piege anti-spam : invisible, il doit rester vide.
export const trainingRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80, "80 caractères maximum"),
  lastName: z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum"),
  email: z.string().trim().min(1, "Email requis").email("Email invalide").max(160),
  phone: z
    .string()
    .trim()
    .min(1, "Téléphone requis")
    .refine((v) => normalizePhone(v) !== null, PHONE_ERROR)
    .transform((v) => normalizePhone(v) as string),
  sessionId: z.string().trim().min(1, "Cohorte requise"),
  message: z.string().trim().max(2000, "2000 caractères maximum").optional().or(z.literal("")),
  website: z.string().optional(),
})

export type TrainingRegistrationInput = z.infer<typeof trainingRegistrationSchema>


// Cohorte d'un programme. Le titre stocke est calcule ("Programme · libellé").
// Prix et places : valeurs par defaut du programme si absents.
export const trainingSessionSchema = z.object({
  programId: z.string().trim().min(1, "Programme requis"),
  label: z.string().trim().max(60, "60 caractères maximum").optional().or(z.literal("")),
  scheduleText: z.string().trim().max(160, "160 caractères maximum").optional().or(z.literal("")),
  dateStart: z.string().trim().optional().or(z.literal("")),
  dateEnd: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().min(1, "Lieu requis"),
  maxSeats: z.coerce.number().int().positive("Nombre de places requis").optional(),
  price: z.coerce.number().positive("Prix requis").optional(),
  description: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ouvert", "complet", "annule"]).default("ouvert"),
})

export type TrainingSessionInput = z.infer<typeof trainingSessionSchema>

