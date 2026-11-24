"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MAX_INCLUDED,
  MAX_STEPS,
  SERVICE_KEYS,
  SERVICE_META,
  parseSiteContent,
  type ServiceContent,
  type ServiceKey,
  type ServicesContent,
  type ServicesPage,
} from "@/lib/site-content"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import {
  ContentBlock,
  TextField,
  useContentSave,
} from "@/components/admin/parametres/content-fields"

type Params = Record<string, string>

const EMPTY_SERVICE: ServiceContent = {
  kicker: "",
  title: "",
  titleAccent: "",
  intro: "",
  included: [],
  steps: [],
}

// Parametres > Contenu du site > Services
export function ServicesContentEditor({ params }: { params: Params }) {
  return (
    <div className="space-y-8">
      <PageEditor initial={parseSiteContent("services_page", params.services_page)} />
      <ServicesEditor initial={parseSiteContent("services_content", params.services_content)} />
    </div>
  )
}

function PageEditor({ initial }: { initial: ServicesPage | null }) {
  const [value, setValue] = useState<ServicesPage>(
    initial ?? { kicker: "", title: "", titleAccent: "", lead: "", finalMarquee: "", finalText: "" }
  )
  const { save, saving, status, errors } = useContentSave("services_page")
  const set = (key: keyof ServicesPage) => (v: string) => setValue((prev) => ({ ...prev, [key]: v }))
  return (
    <ContentBlock
      title="En-tête et appel final de la page"
      where="Page /services : titre de la page, introduction et bandeau final."
      onSubmit={() => save(value, "Page Services enregistrée.")}
      saving={saving}
      status={status}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="sp-kicker" label="Surtitre" value={value.kicker} onChange={set("kicker")} error={errors.kicker} max={60} />
        <TextField id="sp-title" label="Titre" required value={value.title} onChange={set("title")} error={errors.title} max={80} />
        <TextField id="sp-accent" label="Titre, accent" value={value.titleAccent} onChange={set("titleAccent")} error={errors.titleAccent} max={80} />
      </div>
      <TextField id="sp-lead" label="Introduction" value={value.lead} onChange={set("lead")} error={errors.lead} max={320} multiline />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="sp-final-marquee"
          label="Bandeau final"
          required
          value={value.finalMarquee}
          onChange={set("finalMarquee")}
          error={errors.finalMarquee}
          max={60}
          hint="*mots* en italique rouge."
        />
        <TextField
          id="sp-final-text"
          label="Texte final"
          required
          value={value.finalText}
          onChange={set("finalText")}
          error={errors.finalText}
          max={240}
          multiline
        />
      </div>
    </ContentBlock>
  )
}

function ServicesEditor({ initial }: { initial: ServicesContent | null }) {
  const [value, setValue] = useState<ServicesContent>(
    initial ?? { live: EMPTY_SERVICE, ceo: EMPTY_SERVICE, creator: EMPTY_SERVICE, social: EMPTY_SERVICE }
  )
  const { save, saving, status, errors } = useContentSave("services_content")
  const update = (key: ServiceKey, patch: Partial<ServiceContent>) =>
    setValue((v) => ({ ...v, [key]: { ...v[key], ...patch } }))

  return (
    <ContentBlock
      title="Les 4 services"
      where="Page /services (un chapitre par service). Le titre, l'introduction et les 4 premiers éléments inclus de CEO Content et Creator Weekend apparaissent aussi dans les cartes Offres de l'accueil."
      onSubmit={() => save(value, "Services enregistrés.")}
      saving={saving}
      status={status}
      submitLabel="Enregistrer les 4 services"
    >
      <Tabs defaultValue="live">
        <TabsList className="flex h-auto flex-wrap">
          {SERVICE_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {SERVICE_META[key].label}
              {Object.keys(errors).some((p) => p.startsWith(`${key}.`)) && (
                <span className="ml-1.5 text-red-600" aria-label="contient des erreurs">
                  !
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {SERVICE_KEYS.map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            <ServiceFields
              serviceKey={key}
              value={value[key]}
              onChange={(patch) => update(key, patch)}
              errors={errors}
            />
          </TabsContent>
        ))}
      </Tabs>
    </ContentBlock>
  )
}

function ServiceFields({
  serviceKey,
  value,
  onChange,
  errors,
}: {
  serviceKey: ServiceKey
  value: ServiceContent
  onChange: (patch: Partial<ServiceContent>) => void
  errors: Record<string, string>
}) {
  const e = (path: string) => errors[`${serviceKey}.${path}`]
  const id = (name: string) => `svc-${serviceKey}-${name}`
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id={id("kicker")} label="Surtitre" value={value.kicker} onChange={(kicker) => onChange({ kicker })} error={e("kicker")} max={60} />
        <TextField id={id("title")} label="Titre" required value={value.title} onChange={(title) => onChange({ title })} error={e("title")} max={60} />
        <TextField
          id={id("accent")}
          label="Titre, accent (italique)"
          value={value.titleAccent}
          onChange={(titleAccent) => onChange({ titleAccent })}
          error={e("titleAccent")}
          max={60}
        />
      </div>
      <TextField
        id={id("intro")}
        label="Introduction"
        required
        value={value.intro}
        onChange={(intro) => onChange({ intro })}
        error={e("intro")}
        max={600}
        multiline
        rows={4}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-700">Ce qui est inclus ({value.included.length} / {MAX_INCLUDED})</p>
        <SortableList
          label={`Éléments inclus : ${SERVICE_META[serviceKey].label}`}
          itemLabel="l'élément"
          items={value.included}
          getKey={(item, i) => `${i}-${serviceKey}`}
          onMove={(from, to) => onChange({ included: moveItem(value.included, from, to) })}
          actions={(_, i) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Supprimer l'élément ${i + 1}`}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onChange({ included: value.included.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          renderItem={(item, i) => (
            <TextField
              id={id(`included-${i}`)}
              label={`Élément ${i + 1}`}
              value={item}
              onChange={(text) =>
                onChange({ included: value.included.map((v, j) => (j === i ? text : v)) })
              }
              error={e(`included.${i}`)}
              max={100}
            />
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.included.length >= MAX_INCLUDED}
          onClick={() => onChange({ included: [...value.included, ""] })}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter un élément
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-700">Comment ça se passe ({value.steps.length} / {MAX_STEPS})</p>
        <SortableList
          label={`Étapes : ${SERVICE_META[serviceKey].label}`}
          itemLabel="l'étape"
          items={value.steps}
          getKey={(_, i) => `${i}-${serviceKey}-step`}
          onMove={(from, to) => onChange({ steps: moveItem(value.steps, from, to) })}
          actions={(_, i) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Supprimer l'étape ${i + 1}`}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onChange({ steps: value.steps.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          renderItem={(step, i) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <TextField
                id={id(`step-${i}-title`)}
                label="Titre"
                required
                value={step.title}
                onChange={(title) =>
                  onChange({ steps: value.steps.map((s, j) => (j === i ? { ...s, title } : s)) })
                }
                error={e(`steps.${i}.title`)}
                max={60}
              />
              <TextField
                id={id(`step-${i}-description`)}
                label="Description"
                required
                value={step.description}
                onChange={(description) =>
                  onChange({ steps: value.steps.map((s, j) => (j === i ? { ...s, description } : s)) })
                }
                error={e(`steps.${i}.description`)}
                max={200}
              />
            </div>
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.steps.length >= MAX_STEPS}
          onClick={() => onChange({ steps: [...value.steps, { title: "", description: "" }] })}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une étape
        </Button>
      </div>
    </div>
  )
}
