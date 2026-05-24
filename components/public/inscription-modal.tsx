"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  trainingRegistrationSchema,
  type TrainingRegistrationInput,
} from "@/lib/schemas"
import type { FormationOption } from "@/components/public/formations-inscription-form"

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#C8151B] focus:outline-none focus:ring-1 focus:ring-[#C8151B]"

export function InscriptionModal({
  sessions,
  defaultSessionId,
  triggerLabel = "S'inscrire",
  triggerClassName = "mt-6 inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]",
}: {
  sessions: FormationOption[]
  defaultSessionId?: string
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<
    { status: "en_attente" | "liste_attente" | "envoye" } | null
  >(null)

  const initialSession =
    defaultSessionId && sessions.some((s) => s.id === defaultSessionId)
      ? defaultSessionId
      : sessions[0]?.id ?? ""

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingRegistrationInput>({
    resolver: zodResolver(trainingRegistrationSchema),
    defaultValues: { sessionId: initialSession },
  })

  // Re-synchronise la session selectionnee a l'ouverture du modal
  useEffect(() => {
    if (open) {
      setServerError(null)
      setSuccess(null)
      reset({ sessionId: initialSession })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
        | {
            success: true
            status?: "en_attente" | "liste_attente"
            dbSkipped?: boolean
          }
        | { error: string }
      if (!response.ok || "error" in result) {
        setServerError(
          "error" in result
            ? result.error
            : "Une erreur est survenue. Reessayez."
        )
      } else {
        setSuccess({ status: result.status ?? "envoye" })
      }
    } catch {
      setServerError("Connexion impossible. Reessayez dans quelques instants.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inscription a la formation</DialogTitle>
          <DialogDescription>
            Reservez votre place. Paiement via Wave Business apres confirmation.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-3 text-lg font-semibold text-emerald-900">
              Inscription confirmee
            </h3>
            <p className="mt-2 text-sm text-emerald-800">
              {success.status === "liste_attente"
                ? "La session est complete. Vous etes inscrit sur la liste d'attente. Nous vous contacterons des qu'une place se libere."
                : "Vous recevrez un email de confirmation sous 24h avec le lien de paiement Wave Business."}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex items-center justify-center rounded-lg border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="im-session"
                className="block text-sm font-medium text-zinc-700"
              >
                Session choisie
              </label>
              <select
                id="im-session"
                {...register("sessionId")}
                className={`${inputClass} bg-white`}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="im-firstName"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Prenom
                </label>
                <input
                  id="im-firstName"
                  type="text"
                  autoComplete="given-name"
                  {...register("firstName")}
                  className={inputClass}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="im-lastName"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Nom
                </label>
                <input
                  id="im-lastName"
                  type="text"
                  autoComplete="family-name"
                  {...register("lastName")}
                  className={inputClass}
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
                  htmlFor="im-email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>
                <input
                  id="im-email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="im-phone"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Telephone
                </label>
                <input
                  id="im-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  className={inputClass}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="im-message"
                className="block text-sm font-medium text-zinc-700"
              >
                Message <span className="text-zinc-400">(optionnel)</span>
              </label>
              <textarea
                id="im-message"
                rows={3}
                {...register("message")}
                className={inputClass}
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
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#C8151B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a01015] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Envoi en cours..." : "Confirmer l'inscription"}
            </button>

            <p className="text-center text-xs text-zinc-500">
              Aucun paiement sur ce site. Lien Wave Business envoye par email
              apres inscription.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
