"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Briefcase,
  Check,
  Clapperboard,
  GraduationCap,
  MessageSquare,
  Radio,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { parseEmphasis } from "@/lib/emphasis"
import {
  QUOTE_CAMERAS,
  QUOTE_CAMERA_KEYS,
  QUOTE_NEEDS,
  QUOTE_NEED_KEYS,
  QUOTE_PLATFORMS,
  QUOTE_PLATFORM_KEYS,
  needFromParams,
  quoteRequestInputSchema,
  type QuoteCameras,
  type QuoteNeed,
  type QuotePlatform,
} from "@/lib/quote-requests"

type Step = 1 | 2 | 3 | 4
type FieldKey =
  | "need"
  | "desiredDate"
  | "location"
  | "organization"
  | "participants"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "description"
  | "platforms"
  | "cameras"

const ICONS: Record<QuoteNeed, LucideIcon> = {
  evenement_live: Radio,
  ceo_content: Briefcase,
  creator_weekend: Clapperboard,
  formation: GraduationCap,
  autre: MessageSquare,
}

const STEP_LABELS = ["Votre besoin", "Les détails", "Vos coordonnées"] as const
const STEP_OF: Record<FieldKey, Step> = {
  need: 1,
  desiredDate: 2,
  location: 2,
  organization: 2,
  participants: 2,
  platforms: 2,
  cameras: 2,
  firstName: 3,
  lastName: 3,
  email: 3,
  phone: 3,
  description: 3,
}

function todayDakar(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar" }).format(new Date())
}

type State = {
  need: QuoteNeed | null
  date: string
  dateUndefined: boolean
  location: string
  organization: string
  platforms: QuotePlatform[]
  cameras: QuoteCameras | null
  participants: string
  firstName: string
  lastName: string
  email: string
  phone: string
  description: string
  website: string
}

const INITIAL: State = {
  need: null,
  date: "",
  dateUndefined: false,
  location: "",
  organization: "",
  platforms: ["youtube", "facebook"],
  cameras: "2",
  participants: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  description: "",
  website: "",
}

// Assistant de devis en 3 etapes (maquette #p-contact). Preselection par
// ?besoin= (ou l'ancien ?service=).
export function QuoteWizard({ successTitle, successText }: { successTitle: string; successText: string }) {
  const searchParams = useSearchParams()
  const preset = needFromParams(searchParams.get("besoin"), searchParams.get("service"))
  const [state, setState] = useState<State>({ ...INITIAL, need: preset })
  const [step, setStep] = useState<Step>(1)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [live, setLive] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [recap, setRecap] = useState<string[]>([])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (preset) setState((s) => ({ ...s, need: preset }))
  }, [preset])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const set = <K extends keyof State>(key: K, value: State[K]) => {
    setState((s) => ({ ...s, [key]: value }))
    if (key in STEP_OF && errors[key as FieldKey]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const announce = (next: Partial<Record<FieldKey, string>>) => {
    setErrors(next)
    const messages = Object.values(next).filter(Boolean)
    const count = messages.length
    setLive(count ? `${count} champ${count > 1 ? "s" : ""} à corriger : ${messages.join(" ")}` : "")
    const first = (Object.keys(STEP_OF) as FieldKey[]).find((k) => next[k])
    if (first) setTimeout(() => document.getElementById(`dv-${first}`)?.focus(), 0)
  }

  const togglePlatform = (p: QuotePlatform) => {
    setState((s) => {
      if (p === "aucune") return { ...s, platforms: s.platforms.includes("aucune") ? [] : ["aucune"] }
      const without = s.platforms.filter((x) => x !== "aucune")
      return { ...s, platforms: without.includes(p) ? without.filter((x) => x !== p) : [...without, p] }
    })
  }

  // Validation de l'etape 2 (meme regles que l'API)
  const validateDetails = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {}
    if (!state.dateUndefined) {
      if (!state.date) next.desiredDate = "Choisissez une date ou cochez « Date à définir »"
      else if (state.date < todayDakar()) next.desiredDate = "Choisissez une date à venir"
    }
    if (!state.location.trim()) next.location = "Lieu requis"
    if (state.need === "formation" && state.participants.trim()) {
      const n = Number(state.participants)
      if (!Number.isInteger(n) || n < 1 || n > 200) next.participants = "Entre 1 et 200 participants"
    }
    announce(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    setServerError(null)
    if (step === 1) {
      if (!state.need) {
        announce({ need: "Choisissez d'abord votre besoin." })
        return
      }
      announce({})
      setStep(2)
    } else if (step === 2 && validateDetails()) {
      setStep(3)
    }
  }

  const payload = () => ({
    need: state.need,
    desiredDate: state.dateUndefined ? null : state.date || null,
    location: state.location,
    organization: state.organization,
    platforms: state.need === "evenement_live" ? state.platforms : [],
    cameras: state.need === "evenement_live" ? state.cameras : null,
    participants: state.need === "formation" ? state.participants : null,
    description: state.description,
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phone: state.phone,
    website: state.website,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setServerError(null)
    const body = payload()
    const parsed = quoteRequestInputSchema.safeParse(body)
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldKey
        if (key in STEP_OF && !next[key]) next[key] = issue.message
      }
      const earliest = Math.min(...(Object.keys(next) as FieldKey[]).map((k) => STEP_OF[k])) as Step
      if (earliest < 3) setStep(earliest)
      announce(next)
      return
    }
    announce({})
    setSubmitting(true)
    try {
      const response = await fetch("/api/contact/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        const issues = (data?.issues ?? {}) as Partial<Record<FieldKey, string[]>>
        const next: Partial<Record<FieldKey, string>> = {}
        for (const [k, v] of Object.entries(issues)) if (v?.[0] && k in STEP_OF) next[k as FieldKey] = v[0]
        if (Object.keys(next).length) announce(next)
        const text = (typeof data?.error === "string" && data.error) || "L'envoi a échoué. Réessayez dans un instant."
        setServerError(text)
        setLive(text)
        return
      }
      const need = parsed.data.need
      setRecap(
        [
          QUOTE_NEEDS[need].label,
          need === "evenement_live" && state.cameras ? QUOTE_CAMERAS[state.cameras] : null,
          need === "evenement_live"
            ? state.platforms.length
              ? state.platforms.map((p) => QUOTE_PLATFORMS[p]).join(", ")
              : "Diffusion à définir"
            : null,
          need === "formation" && state.participants ? `${state.participants} participants` : null,
        ].filter((x): x is string => Boolean(x))
      )
      setStep(4)
    } catch {
      const text = "Connexion impossible. Vérifiez votre réseau et réessayez."
      setServerError(text)
      setLive(text)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setState({ ...INITIAL })
    setErrors({})
    setLive("")
    setServerError(null)
    setStep(1)
  }

  const progress = ["33%", "66%", "100%", "100%"][step - 1]

  return (
    <div className="overflow-hidden rounded-[14px] bg-cine-bg2 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]">
      <div className="border-b border-cine-cream/[0.07] px-6 py-[26px] min-[761px]:px-[34px]">
        <ol aria-label="Étapes de la demande" className="flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            return (
              <li key={label} aria-current={n === step ? "step" : undefined} className={n <= step ? "text-white" : "text-cine-cream/45"}>
                {n} · {label}
                {n < step && <span className="sr-only"> (terminée)</span>}
              </li>
            )
          })}
        </ol>
        <div aria-hidden="true" className="mt-4 h-[3px] overflow-hidden rounded-full bg-cine-cream/[0.08]">
          <i className="block h-full bg-cine-red transition-[width] duration-500 motion-reduce:transition-none" style={{ width: progress }} />
        </div>
      </div>

      <div className="p-6 min-[761px]:p-[34px]">
        <p aria-live="assertive" className="sr-only">
          {live}
        </p>

        {step === 1 && (
          <div>
            <StepTitle ref={headingRef}>Quel est votre besoin ?</StepTitle>
            <div role="group" aria-label="Votre besoin" className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
              {QUOTE_NEED_KEYS.map((key) => {
                const Icon = ICONS[key]
                const on = state.need === key
                return (
                  <button
                    key={key}
                    id={key === QUOTE_NEED_KEYS[0] ? "dv-need" : undefined}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      set("need", key)
                      setErrors({})
                      setLive("")
                    }}
                    className={cn(
                      "flex min-h-[140px] flex-col items-start gap-2.5 rounded-[10px] p-[22px] text-left text-cine-cream/70 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                      on
                        ? "bg-cine-red/[0.16] shadow-[inset_0_0_0_2px_#C8151B]"
                        : "bg-cine-cream/[0.04] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.09)] hover:bg-cine-cream/[0.08]"
                    )}
                  >
                    <Icon className="h-6 w-6 text-cine-yellow" aria-hidden="true" />
                    <strong className="text-[17px] text-white">{QUOTE_NEEDS[key].label}</strong>
                    <small className="text-[13px] leading-[1.5]">{QUOTE_NEEDS[key].hint}</small>
                  </button>
                )
              })}
            </div>
            <div className="mt-[34px] flex flex-wrap items-center justify-between gap-3">
              <span className={cn("text-[14px]", errors.need ? "font-semibold text-cine-yellow" : "text-cine-cream/65")}>
                {errors.need ?? (state.need ? `Choix : ${QUOTE_NEEDS[state.need].label}` : "Sélectionnez votre besoin pour continuer.")}
              </span>
              <PrimaryButton onClick={goNext}>Continuer</PrimaryButton>
            </div>
          </div>
        )}

        {step === 2 && state.need && (
          <div>
            <StepTitle ref={headingRef}>Les détails : {QUOTE_NEEDS[state.need].label}</StepTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[22px]">
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="dv-desiredDate" required>
                  Date souhaitée
                </FieldLabel>
                <input
                  id="dv-desiredDate"
                  type="date"
                  min={todayDakar()}
                  value={state.date}
                  disabled={state.dateUndefined}
                  onChange={(e) => set("date", e.target.value)}
                  aria-invalid={Boolean(errors.desiredDate)}
                  aria-describedby={errors.desiredDate ? "dv-desiredDate-erreur" : undefined}
                  className={cn(inputClass(errors.desiredDate), "[color-scheme:dark] disabled:opacity-40")}
                />
                <label className="mt-1 inline-flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px] text-cine-cream/80">
                  <input
                    id="dv-dateUndefined"
                    type="checkbox"
                    checked={state.dateUndefined}
                    onChange={(e) => {
                      set("dateUndefined", e.target.checked)
                      if (e.target.checked) setErrors((er) => ({ ...er, desiredDate: undefined }))
                    }}
                    className="h-5 w-5 accent-[#C8151B]"
                  />
                  Date à définir
                </label>
                <FieldError id="dv-desiredDate-erreur" error={errors.desiredDate} />
              </div>
              <TextInput id="location" label="Lieu" required placeholder="Ville, salle ou en ligne" value={state.location} onChange={(v) => set("location", v)} error={errors.location} />
              <TextInput id="organization" label="Organisation (facultative)" placeholder="Entreprise, association..." value={state.organization} onChange={(v) => set("organization", v)} error={errors.organization} />
              {state.need === "formation" && (
                <TextInput
                  id="participants"
                  label="Nombre de participants"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={200}
                  placeholder="Entre 1 et 200"
                  value={state.participants}
                  onChange={(v) => set("participants", v)}
                  error={errors.participants}
                />
              )}
            </div>

            {state.need === "evenement_live" && (
              <>
                <fieldset className="mt-7">
                  <legend className={labelClass}>Où diffuser ?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUOTE_PLATFORM_KEYS.map((p) => (
                      <Chip key={p} on={state.platforms.includes(p)} onClick={() => togglePlatform(p)}>
                        {QUOTE_PLATFORMS[p]}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-2 text-[13px] text-cine-cream/60">Plusieurs choix possibles. « Pas de diffusion » remplace les autres.</p>
                </fieldset>
                <fieldset className="mt-7">
                  <legend className={labelClass}>Nombre de caméras</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUOTE_CAMERA_KEYS.map((c) => (
                      <Chip key={c} on={state.cameras === c} onClick={() => set("cameras", c)}>
                        {QUOTE_CAMERAS[c]}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="mt-[34px] flex flex-wrap items-center justify-between gap-3">
              <SecondaryButton onClick={() => setStep(1)}>Retour</SecondaryButton>
              <PrimaryButton onClick={goNext}>Continuer</PrimaryButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <form noValidate onSubmit={submit}>
            <StepTitle ref={headingRef}>Vos coordonnées</StepTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[22px]">
              <TextInput id="firstName" label="Prénom" required autoComplete="given-name" value={state.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
              <TextInput id="lastName" label="Nom" required autoComplete="family-name" value={state.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
              <TextInput id="email" label="Email" required type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.com" value={state.email} onChange={(v) => set("email", v)} error={errors.email} />
              <TextInput id="phone" label="Téléphone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+221 77 123 45 67" value={state.phone} onChange={(v) => set("phone", v)} error={errors.phone} />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <FieldLabel htmlFor="dv-description">Décrivez votre projet</FieldLabel>
              <textarea
                id="dv-description"
                rows={4}
                maxLength={2000}
                placeholder="Audience attendue, déroulé, besoins particuliers..."
                value={state.description}
                onChange={(e) => set("description", e.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "dv-description-erreur" : undefined}
                className={cn(inputClass(errors.description), "min-h-[110px] resize-y")}
              />
              <FieldError id="dv-description-erreur" error={errors.description} />
            </div>
            {/* Champ piege anti-spam : invisible, laisse vide par un humain */}
            <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="dv-website">Ne pas remplir</label>
              <input id="dv-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={state.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            {serverError && <p className="mt-5 text-[15px] font-semibold text-cine-yellow">{serverError}</p>}
            <div className="mt-[34px] flex flex-wrap items-center justify-between gap-3">
              <SecondaryButton onClick={() => setStep(2)}>Retour</SecondaryButton>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-cine-red px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-cine-red-dark disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
                {!submitting && <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-cine-cream/65">
              Vos informations servent uniquement à traiter votre demande.{" "}
              <Link href="/mentions-legales" className="font-semibold text-cine-cream underline underline-offset-2 hover:text-cine-yellow">
                Mentions légales
              </Link>
            </p>
          </form>
        )}

        {step === 4 && (
          <div className="py-[30px] text-center">
            <span aria-hidden="true" className="mx-auto mb-[22px] flex h-[84px] w-[84px] items-center justify-center rounded-full bg-cine-red text-white">
              <Check className="h-[38px] w-[38px]" />
            </span>
            <h2 ref={headingRef} tabIndex={-1} className="mb-3 font-display text-[clamp(40px,5vw,50px)] font-normal leading-none text-white outline-none">
              {parseEmphasis(successTitle).map((s, i) =>
                s.style === "plain" ? (
                  <span key={i}>{s.text}</span>
                ) : (
                  <em key={i} className="italic text-cine-yellow">
                    {s.text}
                  </em>
                )
              )}
            </h2>
            <p className="mx-auto max-w-[480px] text-[16px] leading-[1.7] text-cine-cream/70">{successText}</p>
            {recap.length > 0 && (
              <ul aria-label="Récapitulatif de la demande" className="mb-7 mt-5 flex flex-wrap justify-center gap-2">
                {recap.map((r) => (
                  <li key={r} className="rounded-full bg-cine-cream/[0.07] px-3 py-1.5 text-[13px] text-cine-cream/85">
                    {r}
                  </li>
                ))}
              </ul>
            )}
            <SecondaryButton onClick={reset}>Nouvelle demande</SecondaryButton>
          </div>
        )}
      </div>
    </div>
  )
}

const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cine-cream/65"

function inputClass(error?: string) {
  return cn(
    "min-h-[48px] w-full rounded-none border-0 border-b bg-transparent py-3 text-[18px] text-cine-cream outline-none transition-colors placeholder:text-cine-cream/40 focus:border-cine-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-yellow",
    error ? "border-cine-yellow" : "border-cine-cream/25"
  )
}

const StepTitle = forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(function StepTitle({ children }, ref) {
  return (
    <h2 ref={ref} tabIndex={-1} className="mb-6 font-display text-[clamp(30px,3vw,40px)] font-normal leading-none text-white outline-none">
      {children}
    </h2>
  )
})

function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
      {required && <span aria-hidden="true"> *</span>}
    </label>
  )
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <span id={id} className="text-[13px] font-semibold text-cine-yellow">
      {error}
    </span>
  )
}

function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  ...rest
}: {
  id: FieldKey
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: "email" | "tel" | "numeric" | "text"
  min?: number
  max?: number
}) {
  const inputId = `dv-${id}`
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <input
        id={inputId}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-erreur` : undefined}
        className={inputClass(error)}
        {...rest}
      />
      <FieldError id={`${inputId}-erreur`} error={error} />
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-[44px] rounded-full px-[18px] text-[14px] font-semibold transition-colors",
        on ? "bg-cine-yellow text-cine-bg" : "text-cine-cream/70 shadow-[inset_0_0_0_1px_rgba(244,240,234,0.22)] hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(244,240,234,0.6)]"
      )}
    >
      {children}
    </button>
  )
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-cine-red px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-cine-red-dark"
    >
      {children}
      <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  )
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full px-[26px] text-[15px] font-semibold text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.3)] transition-colors hover:bg-cine-cream hover:text-cine-bg"
    >
      {children}
    </button>
  )
}
