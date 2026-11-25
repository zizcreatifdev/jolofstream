"use client"

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Download, Smartphone } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDeadline } from "@/lib/formations"
import { formatFcfa } from "@/lib/cohort-public"
import { trainingRegistrationSchema } from "@/lib/schemas"
import { useAutoAdvance } from "@/lib/use-auto-advance"
import type { PublicCohort, PublicProgram } from "@/lib/formations-public"
import { COHORT_ROW_CLASS, CohortRowContent, cohortRowTone } from "@/components/public/formations/cohort-row"

type Step = 1 | 2 | 3 | 4

type Result = {
  cohortId: string
  status: "en_attente" | "liste_attente"
  holdExpiresAt: string | null
  waitlistPosition: number | null
  email: string
}

type Fields = { firstName: string; lastName: string; email: string; phone: string; message: string; website: string }
type FieldKey = Exclude<keyof Fields, "website">

const EMPTY: Fields = { firstName: "", lastName: "", email: "", phone: "", message: "", website: "" }
const STORAGE_KEY = "jolof-reservation"
const STEP_LABELS = ["Formation", "Cohorte", "Vos informations", "Confirmation"] as const

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Tunnel de reservation (maquette #p-reserver) : formation, cohorte,
// informations, confirmation. Le choix est reflete dans l'URL.
export function ReservationWizard({
  programs,
  delayLabel,
  initialSlug,
  initialCohortId,
  notice,
}: {
  programs: PublicProgram[]
  delayLabel: string
  initialSlug: string | null
  initialCohortId: string | null
  notice: string | null
}) {
  const single = programs.length === 1
  const [slug, setSlug] = useState<string | null>(initialSlug)
  const [cohortId, setCohortId] = useState<string | null>(initialCohortId)
  const [step, setStep] = useState<Step>(initialCohortId ? 3 : initialSlug ? 2 : 1)
  const [message, setMessage] = useState<string | null>(notice)
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [live, setLive] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const { advance: autoAdvance, settling } = useAutoAdvance()

  const program = programs.find((p) => p.slug === slug) ?? null
  const cohort = program?.cohorts.find((c) => c.id === cohortId) ?? null
  const waitlist = cohort?.status === "full"

  // Confirmation conservee au rechargement (meme onglet)
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("confirmation")) return
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as Result | null
      if (stored && stored.cohortId === initialCohortId) {
        setResult(stored)
        setStep(4)
      }
    } catch {
      // stockage indisponible : etape 3
    }
  }, [initialCohortId])

  // Etat reflete dans l'URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (slug) params.set("f", slug)
    if (cohortId && step >= 3) params.set("c", cohortId)
    if (step === 4) params.set("confirmation", "1")
    const query = params.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url)
    }
  }, [slug, cohortId, step])

  // Focus sur le titre de l'etape a chaque changement (pas au chargement)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    topRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  // Choix uniques : sélection visible 200 ms puis étape suivante (verrou
  // contre le double clic, passage immédiat en mouvement réduit). Changer de
  // formation vide la cohorte ; reprendre la même la conserve.
  const chooseProgram = (event: { detail: number }, p: PublicProgram) =>
    autoAdvance(
      event,
      () => {
        if (p.slug !== slug) setCohortId(null)
        setSlug(p.slug)
        setMessage(null)
      },
      () => setStep(2)
    )
  const chooseCohort = (event: { detail: number }, c: PublicCohort) =>
    autoAdvance(
      event,
      () => {
        setCohortId(c.id)
        setMessage(null)
        setServerError(null)
      },
      () => setStep(3)
    )
  // Retour : le choix précédent reste sélectionné
  const back = () => {
    setServerError(null)
    if (step === 3) setStep(2)
    else if (step === 2) setStep(1)
  }

  const setField = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setFields((f) => ({ ...f, [key]: value }))
    if (key !== "website" && errors[key as FieldKey]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!cohort || submitting) return
    setServerError(null)
    const payload = { ...fields, sessionId: cohort.id }
    const parsed = trainingRegistrationSchema.safeParse(payload)
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldKey
        if (key in EMPTY && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      const count = Object.keys(next).length
      setLive(`${count} champ${count > 1 ? "s" : ""} à corriger : ${Object.values(next).join(" ")}`)
      const first = (["firstName", "lastName", "email", "phone", "message"] as FieldKey[]).find((k) => next[k])
      if (first) document.getElementById(`rv-${first}`)?.focus()
      return
    }
    setErrors({})
    setLive("")
    setSubmitting(true)
    try {
      const response = await fetch("/api/formations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        const issues = (data?.issues ?? {}) as Partial<Record<FieldKey, string[]>>
        const fieldErrors: Partial<Record<FieldKey, string>> = {}
        for (const [k, v] of Object.entries(issues)) if (v?.[0] && k in EMPTY) fieldErrors[k as FieldKey] = v[0]
        setErrors(fieldErrors)
        const text = (typeof data?.error === "string" && data.error) || "La réservation n'a pas pu être enregistrée. Réessayez."
        setServerError(text)
        setLive(text)
        return
      }
      const next: Result = {
        cohortId: cohort.id,
        status: data.status === "liste_attente" ? "liste_attente" : "en_attente",
        holdExpiresAt: data.holdExpiresAt ?? null,
        waitlistPosition: data.waitlistPosition ?? null,
        email: data.email ?? parsed.data.email,
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // stockage indisponible
      }
      setResult(next)
      setStep(4)
    } catch {
      const text = "Connexion impossible. Vérifiez votre réseau et réessayez."
      setServerError(text)
      setLive(text)
    } finally {
      setSubmitting(false)
    }
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-xl bg-white p-[clamp(28px,4vw,48px)] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
        <h2 className="font-display text-[clamp(32px,4vw,48px)] font-normal leading-none">
          Aucune formation ouverte à la réservation.
        </h2>
        <p className="mb-6 mt-4 max-w-[560px] text-[16px] leading-[1.7] text-[#5B4A46]">
          Les prochaines dates sont en préparation. Écrivez-nous pour être prévenu.
        </p>
        <PrimaryLink href="/contact">Nous contacter</PrimaryLink>
      </div>
    )
  }

  const progress = single
    ? ["0%", "33%", "67%", "100%"][step - 1]
    : ["25%", "50%", "75%", "100%"][step - 1]

  return (
    <div className="flex flex-wrap items-start gap-11">
      <div
        ref={topRef}
        className={cn("min-w-0 flex-[1.7_1_560px] scroll-mt-[110px]", settling && "pointer-events-none")}
      >
        <ol aria-label="Étapes de la réservation" className="flex flex-wrap gap-x-[22px] gap-y-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em]">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            // Programme unique : l'etape Formation est sautee et n'est pas affichee
            if (n === 1 && single) return null
            const shown = single ? n - 1 : n
            return (
              <li
                key={label}
                aria-current={n === step ? "step" : undefined}
                className={n <= step ? "text-cine-ink" : "text-[#6E5B56]"}
              >
                {shown} · {label}
                {n < step && <span className="sr-only"> (terminée)</span>}
              </li>
            )
          })}
        </ol>
        <div aria-hidden="true" className="mb-10 mt-3.5 h-[3px] overflow-hidden rounded-full bg-cine-ink/[0.08]">
          <i
            className="block h-full bg-cine-red transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: progress }}
          />
        </div>

        {step === 1 && (
          <div>
            <StepHeading ref={headingRef}>
              Quelle <em className="italic text-cine-red">formation ?</em>
            </StepHeading>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
              {programs.map((p) => {
                const open = p.cohorts.filter((c) => c.status !== "full").length
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => chooseProgram(e, p)}
                    aria-pressed={slug === p.slug}
                    className={cn(
                      "flex flex-col items-start gap-2.5 rounded-xl bg-white p-7 text-left text-cine-ink transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                      slug === p.slug
                        ? "shadow-[inset_0_0_0_2px_#C8151B]"
                        : "shadow-[inset_0_0_0_1px_rgba(26,17,16,0.1)] hover:shadow-[inset_0_0_0_1px_rgba(26,17,16,0.3)]"
                    )}
                  >
                    {p.sessionsCount ? (
                      <span className="rounded-md bg-cine-cream2 px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B5753]">
                        {p.sessionsCount} séance{p.sessionsCount > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    <span className="mb-1 mt-1.5 font-display text-[40px] leading-none tracking-[-0.02em]">{p.name}</span>
                    {(p.tagline || p.description) && (
                      <span className="line-clamp-4 text-[14px] leading-[1.6] text-[#6B5753]">{p.tagline || p.description}</span>
                    )}
                    <span className="mt-2 font-mono text-[12px] font-semibold tracking-[0.06em] text-cine-red">
                      {p.cohorts.length === 0
                        ? "Prochaines dates bientôt"
                        : `${open} ${open > 1 ? "cohortes ouvertes" : "cohorte ouverte"}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && program && (
          <div>
            <StepHeading ref={headingRef}>
              {program.name} : choisissez <em className="italic text-cine-red">votre cohorte.</em>
            </StepHeading>
            {message && (
              <p role="status" className="mb-5 rounded-lg bg-white px-4 py-3 text-[15px] text-cine-ink shadow-[inset_0_0_0_1px_rgba(200,21,27,0.35)]">
                {message}
              </p>
            )}
            {program.cohorts.length === 0 ? (
              <div className="rounded-xl bg-white p-7 shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
                <p className="font-display text-[32px] leading-none">Prochaines dates bientôt</p>
                <p className="mb-5 mt-3 text-[15px] text-[#5B4A46]">
                  Aucune cohorte n&apos;est ouverte pour cette formation. Écrivez-nous pour être prévenu.
                </p>
                <PrimaryLink href="/contact">Nous contacter</PrimaryLink>
              </div>
            ) : (
              <CohortRadios cohorts={program.cohorts} selected={cohortId} onChoose={chooseCohort} />
            )}
            {!single && (
              <div className="mt-6 flex flex-wrap gap-3">
                <SecondaryButton onClick={back}>Changer de formation</SecondaryButton>
              </div>
            )}
          </div>
        )}

        {step === 3 && program && cohort && (
          <form noValidate onSubmit={submit} aria-describedby="rv-cgv">
            <StepHeading ref={headingRef}>
              {waitlist ? "Liste d'attente : vos " : "Vos "}
              <em className="italic text-cine-red">informations.</em>
            </StepHeading>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[22px]">
              <Field id="firstName" label="Prénom" autoComplete="given-name" value={fields.firstName} onChange={setField("firstName")} error={errors.firstName} />
              <Field id="lastName" label="Nom" autoComplete="family-name" value={fields.lastName} onChange={setField("lastName")} error={errors.lastName} />
              <Field id="email" label="Email" type="email" autoComplete="email" inputMode="email" value={fields.email} onChange={setField("email")} error={errors.email} />
              <Field
                id="phone"
                label="Téléphone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+221 77 123 45 67"
                value={fields.phone}
                onChange={setField("phone")}
                error={errors.phone}
                hint="Format sénégalais ou international."
              />
            </div>
            <div className="mt-6">
              <Field
                id="message"
                label="Message (facultatif)"
                multiline
                required={false}
                placeholder="Votre niveau, vos attentes, une question..."
                value={fields.message}
                onChange={setField("message")}
                error={errors.message}
              />
            </div>
            {/* Champ piege anti-spam : invisible, laisse vide par un humain */}
            <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="rv-website">Ne pas remplir</label>
              <input id="rv-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={fields.website} onChange={setField("website")} />
            </div>

            <div className="mt-7 flex items-start gap-3.5 rounded-[10px] bg-white p-5 text-[14px] leading-[1.6] text-[#4A3B38] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-cine-red" aria-hidden="true" />
              <span>
                {waitlist
                  ? "Cette cohorte est complète. Vous rejoignez la liste d'attente et nous vous écrivons dès qu'une place se libère, par ordre d'inscription."
                  : `Après validation, vous recevez par email le montant et votre lien Wave Business. Votre place est gardée ${delayLabel} dans l'attente du paiement.`}
              </span>
            </div>

            <p aria-live="assertive" className={cn("mt-5 text-[15px] font-semibold text-cine-red", !serverError && "sr-only")}>
              {serverError ?? live}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <SecondaryButton onClick={back}>Changer de cohorte</SecondaryButton>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-cine-red px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-cine-red-dark disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Envoi en cours..." : waitlist ? "Rejoindre la liste d'attente" : "Réserver ma place"}
                {!submitting && <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />}
              </button>
            </div>
            <p id="rv-cgv" className="mt-4 text-[13px] text-[#6B5753]">
              En réservant, vous acceptez les{" "}
              <Link href="/cgv" className="font-semibold text-cine-ink underline underline-offset-2 hover:text-cine-red">
                conditions générales de vente
              </Link>
              .
            </p>
          </form>
        )}

        {step === 4 && program && cohort && result && (
          <Confirmation
            headingRef={headingRef}
            program={program}
            cohort={cohort}
            result={result}
            delayLabel={delayLabel}
          />
        )}
      </div>

      <aside aria-label="Récapitulatif" className="w-full min-w-0 flex-[1_1_320px] min-[761px]:sticky min-[761px]:top-[110px]">
        <Recap program={program} cohort={step >= 3 || cohortId ? cohort : null} delayLabel={delayLabel} />
      </aside>
    </div>
  )
}

const StepHeading = forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(function StepHeading(
  { children },
  ref
) {
  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className="mb-[26px] font-display text-[clamp(36px,3.6vw,56px)] font-normal leading-none tracking-[-0.02em] outline-none"
    >
      {children}
    </h2>
  )
})

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-cine-red px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-cine-red-dark"
    >
      {children}
      <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
    </Link>
  )
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full px-[26px] text-[15px] font-semibold text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.25)] transition-colors hover:bg-cine-ink hover:text-white"
    >
      {children}
    </button>
  )
}

// Groupe radio : fleches pour se deplacer, Entree ou Espace pour choisir
function CohortRadios({
  cohorts,
  selected,
  onChoose,
}: {
  cohorts: PublicCohort[]
  selected: string | null
  onChoose: (event: { detail: number }, c: PublicCohort) => void
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = Math.max(0, cohorts.findIndex((c) => c.id === selected))
  const [focusIndex, setFocusIndex] = useState(selectedIndex)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
      if (e.key in keys) {
        e.preventDefault()
        const next = (i + keys[e.key] + cohorts.length) % cohorts.length
        setFocusIndex(next)
        refs.current[next]?.focus()
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault()
        const next = e.key === "Home" ? 0 : cohorts.length - 1
        setFocusIndex(next)
        refs.current[next]?.focus()
      }
    },
    [cohorts.length]
  )
  return (
    <div role="radiogroup" aria-label="Cohortes disponibles" className="flex flex-col gap-2.5">
      {cohorts.map((c, i) => (
        <button
          key={c.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={c.id === selected}
          tabIndex={i === focusIndex ? 0 : -1}
          onKeyDown={(e) => onKeyDown(e, i)}
          onFocus={() => setFocusIndex(i)}
          onClick={(e) => onChoose(e, c)}
          className={`${COHORT_ROW_CLASS} ${cohortRowTone(c, c.id === selected)}`}
        >
          <CohortRowContent cohort={c} headingLevel="span" waitlistNote />
        </button>
      ))}
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  multiline = false,
  required = true,
  ...rest
}: {
  id: FieldKey
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
  hint?: string
  type?: string
  multiline?: boolean
  required?: boolean
  autoComplete?: string
  inputMode?: "email" | "tel" | "text"
  placeholder?: string
}) {
  const inputId = `rv-${id}`
  const describedBy = [hint && `${inputId}-aide`, error && `${inputId}-erreur`].filter(Boolean).join(" ") || undefined
  const common = {
    id: inputId,
    name: id,
    value,
    onChange,
    required,
    "aria-required": required,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    className: cn(
      "w-full rounded-none border-0 border-b bg-transparent py-3 text-[18px] text-cine-ink outline-none transition-colors placeholder:text-[#9A8782] focus:border-cine-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red",
      error ? "border-cine-red" : "border-cine-ink/25"
    ),
    ...rest,
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6660]">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={4} className={cn(common.className, "min-h-[110px] resize-y")} />
      ) : (
        <input {...common} type={type} className={cn(common.className, "min-h-[48px]")} />
      )}
      {hint && (
        <span id={`${inputId}-aide`} className="text-[12px] text-[#7A6660]">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-erreur`} className="text-[13px] font-semibold text-cine-red">
          {error}
        </span>
      )}
    </div>
  )
}

function formatLabel(p: PublicProgram): string | null {
  const hours = [
    p.theoryHours ? `${p.theoryHours} h de théorie` : null,
    p.practiceHours ? `${p.practiceHours} h de pratique` : null,
  ].filter(Boolean)
  const parts = [p.sessionsCount ? `${p.sessionsCount} séance${p.sessionsCount > 1 ? "s" : ""}` : null, hours.join(", ") || null].filter(Boolean)
  return parts.length ? parts.join(" · ") : null
}

function Recap({
  program,
  cohort,
  delayLabel,
}: {
  program: PublicProgram | null
  cohort: PublicCohort | null
  delayLabel: string
}) {
  const rows = useMemo(
    () => [
      ["Formation", program?.name ?? null],
      ["Cohorte", cohort?.name ?? null],
      ["Dates", cohort?.datesLabel ?? null],
      ["Lieu", cohort?.location ?? null],
      ["Format", program ? formatLabel(program) : null],
      [
        "Tarif",
        cohort ? formatFcfa(cohort.price) : program?.minPrice != null ? `À partir de ${formatFcfa(program.minPrice)}` : null,
      ],
      [
        "Places",
        cohort
          ? cohort.status === "full"
            ? "Complète, liste d'attente"
            : `${cohort.left} ${cohort.left > 1 ? "restantes" : "restante"} sur ${cohort.maxSeats}`
          : null,
      ],
    ],
    [program, cohort]
  )
  return (
    <div className="rounded-xl bg-cine-ink p-[30px] text-cine-cream">
      <p className="inline-flex items-center gap-3 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-cine-yellow">
        <i aria-hidden="true" className="cine-blink block h-2 w-2 rounded-full bg-cine-red" />
        Récapitulatif
      </p>
      <h2 className="mb-[22px] mt-3 font-display text-[30px] font-normal">Votre réservation</h2>
      <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3 text-[14px]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="pt-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-cine-cream/55">
              {label}
            </dt>
            <dd className={cn("m-0", value ? "text-cine-cream" : "text-cine-cream/60")}>{value ?? "À choisir"}</dd>
          </div>
        ))}
      </dl>
      {program?.brochure && (
        <a
          href={program.brochure.href}
          className="mt-5 flex min-h-[48px] items-center justify-between gap-3 rounded-[10px] bg-cine-cream/[0.06] px-4 py-3.5 text-[14px] text-cine-cream transition-colors hover:bg-cine-cream/[0.12]"
        >
          <span>
            Plaquette de la formation · PDF{program.brochure.size ? `, ${program.brochure.size}` : ""}
          </span>
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      )}
      <p className="mt-[22px] border-t border-cine-cream/10 pt-5 text-[13px] leading-[1.6] text-cine-cream/70">
        Paiement par Wave Business uniquement, via le lien reçu par email. Aucun paiement sur le site. Délai de
        paiement : {delayLabel}.
      </p>
    </div>
  )
}

function Confirmation({
  headingRef,
  program,
  cohort,
  result,
  delayLabel,
}: {
  headingRef: React.Ref<HTMLHeadingElement>
  program: PublicProgram
  cohort: PublicCohort
  result: Result
  delayLabel: string
}) {
  const waitlisted = result.status === "liste_attente"
  const deadline = result.holdExpiresAt ? formatDeadline(result.holdExpiresAt) : null
  const items: Array<{ done: boolean; title: string; detail: string }> = waitlisted
    ? [
        { done: true, title: "Inscription en liste d'attente", detail: `${program.name} · ${cohort.name}` },
        { done: false, title: "Une place se libère", detail: "Vous êtes prévenu par email, par ordre d'inscription" },
        { done: false, title: "Paiement Wave Business", detail: `Lien envoyé avec l'email de place libérée, à régler sous ${delayLabel}` },
      ]
    : [
        { done: true, title: "Inscription reçue", detail: `${program.name} · ${cohort.name}` },
        {
          done: false,
          title: "Paiement Wave Business",
          detail: deadline ? `À régler avant le ${deadline} (heure de Dakar)` : `À régler sous ${delayLabel}`,
        },
        { done: false, title: "Place confirmée", detail: "L'équipe valide le paiement et vous envoie les infos pratiques" },
      ]
  return (
    <div>
      <span aria-hidden="true" className="mb-[22px] flex h-14 w-14 items-center justify-center rounded-full bg-cine-red text-white">
        <Check className="h-7 w-7" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-3.5 font-display text-[clamp(40px,4vw,60px)] font-normal leading-none outline-none"
      >
        {waitlisted ? (
          <>
            Vous êtes sur la <em className="italic text-cine-red">liste d&apos;attente.</em>
          </>
        ) : (
          <>
            Place <em className="italic text-cine-red">pré-réservée.</em>
          </>
        )}
      </h2>
      {waitlisted ? (
        <div className="max-w-[580px] space-y-3 text-[17px] leading-[1.7] text-[#5B4A46]">
          {result.waitlistPosition ? (
            <p className="m-0">
              Vous êtes en <b className="text-cine-ink">position {result.waitlistPosition}</b> dans la file d&apos;attente
              de la cohorte {cohort.name}.
            </p>
          ) : null}
          <p className="m-0">
            Si une place se libère, vous recevez un email et disposez de {delayLabel} pour régler. Un email de
            confirmation vient de partir à <b className="text-cine-ink">{result.email}</b>.
          </p>
        </div>
      ) : (
        <div className="max-w-[580px] space-y-3 text-[17px] leading-[1.7] text-[#5B4A46]">
          {deadline && (
            <p className="m-0 text-cine-ink">
              Paiement à effectuer avant le <b>{deadline}</b> (heure de Dakar).
            </p>
          )}
          <p className="m-0">
            Un email vient de partir à <b className="text-cine-ink">{result.email}</b> avec le montant, votre lien Wave
            Business{program.brochure ? " et la plaquette de la formation" : ""}.
          </p>
        </div>
      )}
      <p className="mt-3 max-w-[580px] text-[15px] text-[#6B5753]">
        Rien reçu d&apos;ici quelques minutes ? Vérifiez vos courriers indésirables (spams).
      </p>
      <ol className="my-7 flex max-w-[560px] flex-col gap-0.5">
        {items.map((item, i) => (
          <li
            key={item.title}
            className="flex items-start gap-3.5 rounded-[10px] bg-white px-[18px] py-4 text-[15px] leading-[1.5] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.07)]"
          >
            <b
              className={cn(
                "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-mono text-[12px]",
                item.done ? "bg-cine-red text-white" : "bg-cine-cream2 text-[#6B5753]"
              )}
            >
              {item.done ? <Check className="h-3.5 w-3.5" aria-label="Fait" /> : i + 1}
            </b>
            <div>
              {item.title}
              <small className="mt-0.5 block text-[13px] text-[#6B5753]">{item.detail}</small>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/formations"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-cine-bg px-[26px] text-[15px] font-semibold text-white hover:bg-black"
        >
          Voir les autres cohortes
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full px-[26px] text-[15px] font-semibold text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.25)] hover:bg-cine-ink hover:text-white"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
