"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  MAX_SKILLS,
  parseEmphasis,
  parseSiteContent,
  type HomeFinalCta,
  type HomeManifesto,
  type HomeSections,
  type HomeSkills,
} from "@/lib/site-content"
import { MediaUpload } from "@/components/admin/ui/media-upload"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import {
  ContentBlock,
  TextField,
  useContentSave,
} from "@/components/admin/parametres/content-fields"

type Params = Record<string, string>

// Parametres > Contenu du site > Accueil
export function HomeContentEditor({ params }: { params: Params }) {
  return (
    <div className="space-y-8">
      <ManifestoEditor initial={parseSiteContent("home_manifesto", params.home_manifesto)} />
      <SkillsEditor initial={parseSiteContent("home_skills", params.home_skills)} />
      <SectionsEditor initial={parseSiteContent("home_sections", params.home_sections)} />
      <FinalCtaEditor initial={parseSiteContent("home_final_cta", params.home_final_cta)} />
    </div>
  )
}

function ManifestoEditor({ initial }: { initial: HomeManifesto | null }) {
  const [value, setValue] = useState<HomeManifesto>(initial ?? { kicker: "", text: "" })
  const { save, saving, status, errors } = useContentSave("home_manifesto")
  return (
    <ContentBlock
      title="Manifeste"
      where="Accueil, sous le hero : grand texte dont les mots s'allument au défilement. Section masquée si le texte est vide."
      onSubmit={() => save(value, "Manifeste enregistré.")}
      saving={saving}
      status={status}
    >
      <TextField
        id="home-manifesto-kicker"
        label="Surtitre"
        value={value.kicker}
        onChange={(kicker) => setValue((v) => ({ ...v, kicker }))}
        error={errors.kicker}
        max={60}
      />
      <TextField
        id="home-manifesto-text"
        label="Texte"
        value={value.text}
        onChange={(text) => setValue((v) => ({ ...v, text }))}
        error={errors.text}
        max={320}
        multiline
        rows={4}
        hint="Syntaxe : *mots* en italique jaune, **mots** en rouge."
      />
      <div className="rounded-lg bg-[#050303] p-5" aria-label="Aperçu du manifeste">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aperçu</p>
        <p className="mt-2 font-display text-3xl leading-tight text-[#F4F0EA]">
          {value.text.trim() ? (
            parseEmphasis(value.text).map((s, i) =>
              s.style === "em" ? (
                <em key={i} className="italic text-[#F5B800]">
                  {s.text}
                </em>
              ) : s.style === "strong" ? (
                <span key={i} className="text-[#E23A3F]">
                  {s.text}
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              )
            )
          ) : (
            <span className="text-zinc-500">Texte vide : la section est masquée.</span>
          )}
        </p>
      </div>
    </ContentBlock>
  )
}

const EMPTY_SKILLS: HomeSkills = { kicker: "", title: "", titleAccent: "", items: [] }

function SkillsEditor({ initial }: { initial: HomeSkills | null }) {
  const [value, setValue] = useState<HomeSkills>(initial ?? EMPTY_SKILLS)
  // Cles stables des elements pour React pendant les deplacements
  const [keys, setKeys] = useState<string[]>(() => (initial?.items ?? []).map((_, i) => `s${i}`))
  const [counter, setCounter] = useState((initial?.items ?? []).length)
  const { save, saving, status, errors } = useContentSave("home_skills")

  const setItem = (index: number, patch: Partial<HomeSkills["items"][number]>) =>
    setValue((v) => ({
      ...v,
      items: v.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))

  return (
    <ContentBlock
      title="Savoir-faire"
      where="Accueil, après le manifeste : liste numérotée et panneau d'aperçu (image facultative). Section masquée sans élément."
      onSubmit={() => save(value, "Savoir-faire enregistrés.")}
      saving={saving}
      status={status}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          id="home-skills-kicker"
          label="Surtitre"
          value={value.kicker}
          onChange={(kicker) => setValue((v) => ({ ...v, kicker }))}
          error={errors.kicker}
          max={60}
        />
        <TextField
          id="home-skills-title"
          label="Titre"
          required
          value={value.title}
          onChange={(title) => setValue((v) => ({ ...v, title }))}
          error={errors.title}
          max={80}
        />
        <TextField
          id="home-skills-accent"
          label="Titre, accent (italique)"
          value={value.titleAccent}
          onChange={(titleAccent) => setValue((v) => ({ ...v, titleAccent }))}
          error={errors.titleAccent}
          max={80}
        />
      </div>

      <SortableList
        label="Savoir-faire"
        itemLabel="le savoir-faire"
        items={value.items}
        getKey={(_, i) => keys[i] ?? `s${i}`}
        onMove={(from, to) => {
          setValue((v) => ({ ...v, items: moveItem(v.items, from, to) }))
          setKeys((k) => moveItem(k, from, to))
        }}
        actions={(_, i) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Supprimer le savoir-faire ${i + 1}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              setValue((v) => ({ ...v, items: v.items.filter((_, j) => j !== i) }))
              setKeys((k) => k.filter((_, j) => j !== i))
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        renderItem={(item, i) => (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              <TextField
                id={`skill-${i}-title`}
                label="Titre"
                required
                value={item.title}
                onChange={(title) => setItem(i, { title })}
                error={errors[`items.${i}.title`]}
                max={80}
              />
              <TextField
                id={`skill-${i}-description`}
                label="Description"
                required
                value={item.description}
                onChange={(description) => setItem(i, { description })}
                error={errors[`items.${i}.description`]}
                max={220}
                multiline
              />
            </div>
            <MediaUpload
              id={`skill-${i}-image`}
              target={{ bucket: "site", kind: "image" }}
              profile="skill"
              value={item.imageUrl}
              onChange={(imageUrl) => setItem(i, { imageUrl })}
              label="Image (facultative)"
              hint="Format portrait 4:5. Sans image : panneau uni avec le grand numéro."
              error={errors[`items.${i}.imageUrl`]}
            />
          </div>
        )}
      />
      {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={value.items.length >= MAX_SKILLS}
          onClick={() => {
            setValue((v) => ({
              ...v,
              items: [...v.items, { title: "", description: "", imageUrl: null }],
            }))
            setKeys((k) => [...k, `n${counter}`])
            setCounter((c) => c + 1)
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter un savoir-faire
        </Button>
        {value.items.length >= MAX_SKILLS && (
          <p className="text-sm text-zinc-500">{MAX_SKILLS} savoir-faire maximum.</p>
        )}
      </div>
    </ContentBlock>
  )
}

const EMPTY_SECTIONS: HomeSections = {
  worksKicker: "",
  worksTitle: "",
  worksTitleAccent: "",
  worksText: "",
  offersKicker: "",
  offersTitle: "",
  offersTitleAccent: "",
  formationsTitle: "",
  formationsText: "",
  testimonialsKicker: "",
  testimonialsTitle: "",
  testimonialsTitleAccent: "",
  galleryKicker: "",
  galleryTitle: "",
  galleryTitleAccent: "",
}

function SectionsEditor({ initial }: { initial: HomeSections | null }) {
  const [value, setValue] = useState<HomeSections>({ ...EMPTY_SECTIONS, ...(initial ?? {}) })
  const { save, saving, status, errors } = useContentSave("home_sections")
  const field = (
    key: keyof HomeSections,
    label: string,
    max: number,
    options: { required?: boolean; multiline?: boolean } = {}
  ) => (
    <TextField
      id={`home-sections-${key}`}
      label={label}
      value={value[key]}
      onChange={(v) => setValue((prev) => ({ ...prev, [key]: v }))}
      error={errors[key]}
      max={max}
      required={options.required}
      multiline={options.multiline}
    />
  )
  return (
    <ContentBlock
      title="Titres des sections"
      where="Accueil : titres des sections Réalisations, Offres (et carte Formations), Galerie et Témoignages."
      onSubmit={() => save(value, "Titres enregistrés.")}
      saving={saving}
      status={status}
    >
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Réalisations</legend>
        {field("worksKicker", "Surtitre", 60)}
        {field("worksTitle", "Titre", 80, { required: true })}
        {field("worksTitleAccent", "Accent", 80)}
        <div className="sm:col-span-3">{field("worksText", "Texte", 200)}</div>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Offres</legend>
        {field("offersKicker", "Surtitre", 60)}
        {field("offersTitle", "Titre", 80, { required: true })}
        {field("offersTitleAccent", "Accent", 80)}
        {field("formationsTitle", "Carte Formations, titre", 80, { required: true })}
        <div className="sm:col-span-2">
          {field("formationsText", "Carte Formations, texte", 320, { multiline: true })}
        </div>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Témoignages</legend>
        {field("testimonialsKicker", "Surtitre", 60)}
        {field("testimonialsTitle", "Titre", 80, { required: true })}
        {field("testimonialsTitleAccent", "Accent", 80)}
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-700">Galerie</legend>
        {field("galleryKicker", "Surtitre", 60)}
        {field("galleryTitle", "Titre", 80)}
        {field("galleryTitleAccent", "Accent", 80)}
      </fieldset>
    </ContentBlock>
  )
}

function FinalCtaEditor({ initial }: { initial: HomeFinalCta | null }) {
  const [value, setValue] = useState<HomeFinalCta>(
    initial ?? { marquee: "", text: "", cta1Label: "", cta1Href: "/contact" }
  )
  const { save, saving, status, errors } = useContentSave("home_final_cta")
  return (
    <ContentBlock
      title="Appel final"
      where="Bas de l'accueil : bandeau défilant géant, texte, bouton et téléphone (Paramètres > Entreprise)."
      onSubmit={() => save(value, "Appel final enregistré.")}
      saving={saving}
      status={status}
    >
      <TextField
        id="home-final-marquee"
        label="Bandeau défilant"
        required
        value={value.marquee}
        onChange={(marquee) => setValue((v) => ({ ...v, marquee }))}
        error={errors.marquee}
        max={60}
        hint="*mots* en italique rouge. Exemple : Votre prochain *direct*"
      />
      <TextField
        id="home-final-text"
        label="Texte"
        required
        value={value.text}
        onChange={(text) => setValue((v) => ({ ...v, text }))}
        error={errors.text}
        max={240}
        multiline
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="home-final-cta-label"
          label="Bouton, libellé"
          required
          value={value.cta1Label}
          onChange={(cta1Label) => setValue((v) => ({ ...v, cta1Label }))}
          error={errors.cta1Label}
          max={40}
        />
        <TextField
          id="home-final-cta-href"
          label="Bouton, lien"
          required
          value={value.cta1Href}
          onChange={(cta1Href) => setValue((v) => ({ ...v, cta1Href }))}
          error={errors.cta1Href}
          placeholder="/contact"
        />
      </div>
    </ContentBlock>
  )
}
