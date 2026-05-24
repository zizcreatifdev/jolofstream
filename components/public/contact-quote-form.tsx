"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"

import {
  quoteRequestSchema,
  serviceTypeLabels,
  type QuoteRequestInput,
} from "@/lib/schemas"

const serviceOptions = (
  Object.entries(serviceTypeLabels) as [QuoteRequestInput["serviceType"], string][]
).map(([value, label]) => ({ value, label }))

const DEFAULT_SERVICE: QuoteRequestInput["serviceType"] =
  "captation-streaming-live"

function resolveService(
  param: string | null
): QuoteRequestInput["serviceType"] {
  if (param && serviceOptions.some((o) => o.value === param)) {
    return param as QuoteRequestInput["serviceType"]
  }
  return DEFAULT_SERVICE
}

export function ContactQuoteForm() {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()
  const initialService = resolveService(searchParams.get("service"))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      serviceType: initialService,
    },
  })

  const onSubmit = async (data: QuoteRequestInput) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const response = await fetch("/api/contact/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as
        | { success: true; clientId?: string; dbSkipped?: boolean }
        | { error: string }
      if (!response.ok || "error" in result) {
        setServerError(
          "error" in result ? result.error : "Une erreur est survenue. Reessayez."
        )
      } else {
        setSuccess(true)
        reset({ serviceType: initialService })
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
          Demande envoyee
        </h3>
        <p className="mt-2 text-sm text-emerald-800">
          Votre demande a ete envoyee. Nous vous repondrons sous 24h.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-firstName"
            className="block text-sm font-medium text-zinc-700"
          >
            Prenom
          </label>
          <input
            id="contact-firstName"
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
            htmlFor="contact-lastName"
            className="block text-sm font-medium text-zinc-700"
          >
            Nom
          </label>
          <input
            id="contact-lastName"
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
            htmlFor="contact-email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="contact-email"
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
            htmlFor="contact-phone"
            className="block text-sm font-medium text-zinc-700"
          >
            Telephone
          </label>
          <input
            id="contact-phone"
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
          htmlFor="contact-organization"
          className="block text-sm font-medium text-zinc-700"
        >
          Organisation
        </label>
        <input
          id="contact-organization"
          type="text"
          autoComplete="organization"
          {...register("organization")}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
        />
        {errors.organization && (
          <p className="mt-1 text-xs text-red-600">
            {errors.organization.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-serviceType"
            className="block text-sm font-medium text-zinc-700"
          >
            Type de service
          </label>
          <select
            id="contact-serviceType"
            {...register("serviceType")}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          >
            {serviceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="mt-1 text-xs text-red-600">
              {errors.serviceType.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="contact-desiredDate"
            className="block text-sm font-medium text-zinc-700"
          >
            Date souhaitee
          </label>
          <input
            id="contact-desiredDate"
            type="date"
            {...register("desiredDate")}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
          />
          {errors.desiredDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.desiredDate.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-location"
          className="block text-sm font-medium text-zinc-700"
        >
          Lieu
        </label>
        <input
          id="contact-location"
          type="text"
          {...register("location")}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"
        />
        {errors.location && (
          <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-description"
          className="block text-sm font-medium text-zinc-700"
        >
          Description du projet{" "}
          <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="contact-description"
          rows={5}
          {...register("description")}
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
        {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  )
}
