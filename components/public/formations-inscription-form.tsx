"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"

import {
  trainingRegistrationSchema,
  type TrainingRegistrationInput,
} from "@/lib/schemas"

export type FormationOption = {
  id: string
  label: string
  full?: boolean
}

export function FormationsInscriptionForm({
  sessions,
}: {
  sessions: FormationOption[]
}) {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<
    | { status: "en_attente" | "liste_attente" | "envoye" }
    | null
  >(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingRegistrationInput>({
    resolver: zodResolver(trainingRegistrationSchema),
    defaultValues: {
      sessionId: sessions[0]?.id ?? "",
    },
  })

  const onSubmit = async (data: TrainingRegistrationInput) => {
    setSubmitting(true)
    setServerError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/formations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as
        | { success: true; status?: "en_attente" | "liste_attente"; dbSkipped?: boolean }
        | { error: string }
      if (!response.ok || "error" in result) {
        setServerError(
          "error" in result ? result.error : "Une erreur est survenue. Reessayez."
        )
      } else {
        setSuccess({ status: result.status ?? "envoye" })
        reset({ sessionId: sessions[0]?.id ?? "" })
      }
    } catch {
      setServerError("Connexion impossible. Reessayez dans quelques instants.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
      >
        <h3 className="text-lg font-semibold text-emerald-900">
          Inscription enregistree
        </h3>
        <p className="mt-2 text-sm text-emerald-800">
          {success.status === "liste_attente"
            ? "La session est complete. Vous etes inscrit sur la liste d'attente. Nous vous contacterons des qu'une place se libere."
            : "Votre inscription a ete enregistree. Vous recevrez un email de confirmation sous 24h avec le lien de paiement Wave Business."}
        </p>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-zinc-700"
          >
            Prenom
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            {...register("firstName")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-zinc-700"
          >
            Nom
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            {...register("lastName")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-zinc-700"
          >
            Telephone
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="sessionId"
          className="block text-sm font-medium text-zinc-700"
        >
          Session choisie
        </label>
        <select
          id="sessionId"
          {...register("sessionId")}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
              {session.full ? " (liste d'attente)" : ""}
            </option>
          ))}
        </select>
        {errors.sessionId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.sessionId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-zinc-700"
        >
          Message <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="message"
          rows={4}
          {...register("message")}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-[#C8151B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a01015] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Envoi en cours..." : "M'inscrire"}
      </button>
    </form>
  )
}
