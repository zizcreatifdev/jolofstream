"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FORMATIONS_PAGE_DEFAULT,
  MAX_FLOW_STEPS,
  parseSiteContent,
  type FormationsPage,
} from "@/lib/site-content"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import {
  ContentBlock,
  TextField,
  useContentSave,
} from "@/components/admin/parametres/content-fields"

type Params = Record<string, string>

// Parametres > Contenu du site > Formations : textes de la page /formations.
// Tant que rien n'est enregistre, la page utilise le contenu initial.
export function FormationsContentEditor({ params }: { params: Params }) {
  const stored = parseSiteContent("formations_page", params.formations_page)
  const [value, setValue] = useState<FormationsPage>(stored ?? FORMATIONS_PAGE_DEFAULT)
  const [keys, setKeys] = useState<string[]>(() => value.steps.map((_, i) => `s${i}`))
  const [counter, setCounter] = useState(value.steps.length)
  const { save, saving, status, errors } = useContentSave("formations_page")

  const field = (
    key: Exclude<keyof FormationsPage, "steps">,
    label: string,
    max: number,
    options: { required?: boolean; multiline?: boolean; hint?: string } = {}
  ) => (
    <TextField
      id={`fp-${key}`}
      label={label}
      value={value[key]}
      onChange={(v) => setValue((prev) => ({ ...prev, [key]: v }))}
      error={errors[key]}
      max={max}
      required={options.required}
      multiline={options.multiline}
      hint={options.hint}
    />
  )
  const setStep = (index: number, patch: Partial<FormationsPage["steps"][number]>) =>
    setValue((v) => ({ ...v, steps: v.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)) }))

  return (
    <ContentBlock
      title="Page Formations"
      where="Page /formations : en-tête, titres des sections, bloc Formation sur mesure entreprise et déroulé de la réservation. Fiches, cohortes, plaquettes et témoignages se gèrent dans le module Formations."
      onSubmit={() => save(value, "Page Formations enregistrée.")}
      saving={saving}
      status={status}
    >
      {!stored && (
        <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          Contenu initial affiché sur le site. Il sera enregistré en base au premier enregistrement.
        </p>
      )}
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">En-tête de la page</legend>
        {field("kicker", "Surtitre", 60)}
        {field("title", "Titre", 80, { required: true })}
        {field("titleAccent", "Titre, accent", 80)}
        <div className="sm:col-span-3">{field("lead", "Introduction", 400, { multiline: true })}</div>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Liste des formations</legend>
        {field("listKicker", "Surtitre", 60)}
        {field("listTitle", "Titre", 80, { required: true })}
        {field("listTitleAccent", "Titre, accent", 80)}
        <div className="sm:col-span-3">{field("listLead", "Texte", 320, { multiline: true })}</div>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Parcours d&apos;anciens</legend>
        {field("alumniKicker", "Surtitre", 60, { hint: "Suivi du code du programme." })}
        {field("alumniTitle", "Titre", 80, { required: true })}
        {field("alumniTitleAccent", "Titre, accent", 80)}
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Formation sur mesure entreprise</legend>
        {field("soonKicker", "Surtitre", 60)}
        {field("soonTitle", "Titre", 120, { required: true })}
        {field("soonCta", "Bouton", 40, { required: true, hint: "Mène au formulaire de contact." })}
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Déroulé de la réservation</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {field("flowKicker", "Surtitre", 60)}
          {field("flowTitle", "Titre", 80, { required: true })}
          {field("flowTitleAccent", "Titre, accent", 80)}
        </div>
        <p className="text-xs text-zinc-500">
          Écrivez {"{delai}"} pour afficher le délai de paiement (Paramètres &gt; Formations). Formulation
          conseillée : « la place peut être libérée », la libération restant une décision de l&apos;équipe.
        </p>
        <SortableList
          label="Étapes de la réservation"
          itemLabel="l'étape"
          items={value.steps}
          getKey={(_, i) => keys[i] ?? `s${i}`}
          onMove={(from, to) => {
            setValue((v) => ({ ...v, steps: moveItem(v.steps, from, to) }))
            setKeys((k) => moveItem(k, from, to))
          }}
          actions={(_, i) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Supprimer l'étape ${i + 1}`}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setValue((v) => ({ ...v, steps: v.steps.filter((_, j) => j !== i) }))
                setKeys((k) => k.filter((_, j) => j !== i))
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          renderItem={(step, i) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <TextField
                id={`fp-step-${i}-title`}
                label="Titre"
                required
                value={step.title}
                onChange={(title) => setStep(i, { title })}
                error={errors[`steps.${i}.title`]}
                max={60}
              />
              <TextField
                id={`fp-step-${i}-text`}
                label="Texte"
                required
                value={step.text}
                onChange={(text) => setStep(i, { text })}
                error={errors[`steps.${i}.text`]}
                max={240}
                multiline
              />
            </div>
          )}
        />
        {errors.steps && <p className="text-xs text-red-600">{errors.steps}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.steps.length >= MAX_FLOW_STEPS}
          onClick={() => {
            setValue((v) => ({ ...v, steps: [...v.steps, { title: "", text: "" }] }))
            setKeys((k) => [...k, `n${counter}`])
            setCounter((c) => c + 1)
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une étape
        </Button>
      </fieldset>
    </ContentBlock>
  )
}
