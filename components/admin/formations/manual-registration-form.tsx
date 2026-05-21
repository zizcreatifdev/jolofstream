"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  trainingRegistrationSchema,
  type TrainingRegistrationInput,
} from "@/lib/schemas"

export function ManualRegistrationForm({
  open,
  onOpenChange,
  sessionId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingRegistrationInput>({
    resolver: zodResolver(trainingRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      sessionId,
      message: "",
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      sessionId,
      message: "",
    })
  }, [open, sessionId, reset])

  const onSubmit = async (values: TrainingRegistrationInput) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const response = await fetch("/api/formations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setServerError(
          (data && typeof data.error === "string" && data.error) ||
            "Echec de l'enregistrement."
        )
        return
      }
      onSaved()
      onOpenChange(false)
    } catch {
      setServerError("Connexion impossible. Reessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle>Ajouter une inscription</SheetTitle>
          <SheetDescription>
            L&apos;inscription sera creee en statut En attente. Vous pourrez
            confirmer le paiement Wave ensuite.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 py-4"
          noValidate
        >
          <input type="hidden" {...register("sessionId")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-firstName">Prenom *</Label>
              <Input id="reg-firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-lastName">Nom *</Label>
              <Input id="reg-lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Telephone *</Label>
              <Input id="reg-phone" type="tel" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-message">Message (optionnel)</Label>
            <Textarea id="reg-message" rows={3} {...register("message")} />
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#C8151B] text-white hover:bg-[#a01015]"
            >
              {submitting ? "Enregistrement..." : "Ajouter l'inscription"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
