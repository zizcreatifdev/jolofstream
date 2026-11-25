"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  MAX_FAQ,
  parseSiteContent,
  type AboutPage,
  type ContactPage,
  type FaqItems,
  type PortfolioPage,
} from "@/lib/site-content"
import { SortableList, moveItem } from "@/components/admin/ui/sortable-list"
import { ContentBlock, TextField, useContentSave } from "@/components/admin/parametres/content-fields"

type Params = Record<string, string>

// Parametres > Contenu du site > Contact : en-tete, zone, succes, FAQ
export function ContactContentEditor({ params }: { params: Params }) {
  return (
    <div className="space-y-8">
      <ContactPageEditor initial={parseSiteContent("contact_page", params.contact_page)} />
      <FaqEditor initial={parseSiteContent("faq_items", params.faq_items)} />
    </div>
  )
}

function ContactPageEditor({ initial }: { initial: ContactPage | null }) {
  const [value, setValue] = useState<ContactPage>(
    initial ?? { kicker: "", title: "", titleAccent: "", lead: "", zoneText: "", successTitle: "", successText: "" }
  )
  const { save, saving, status, errors } = useContentSave("contact_page")
  const set = (key: keyof ContactPage) => (v: string) => setValue((prev) => ({ ...prev, [key]: v }))
  return (
    <ContentBlock
      title="Page Contact"
      where="Page /contact : en-tête, texte de zone d'intervention sous les coordonnées (Informations de l'agence) et écran de succès de l'assistant de devis."
      onSubmit={() => save(value, "Page Contact enregistrée.")}
      saving={saving}
      status={status}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="cp-kicker" label="Surtitre" value={value.kicker} onChange={set("kicker")} error={errors.kicker} max={60} />
        <TextField id="cp-title" label="Titre" required value={value.title} onChange={set("title")} error={errors.title} max={80} />
        <TextField id="cp-accent" label="Titre, accent" value={value.titleAccent} onChange={set("titleAccent")} error={errors.titleAccent} max={80} />
      </div>
      <TextField id="cp-lead" label="Introduction" value={value.lead} onChange={set("lead")} error={errors.lead} max={320} multiline />
      <TextField id="cp-zone" label="Zone d'intervention" value={value.zoneText} onChange={set("zoneText")} error={errors.zoneText} max={320} multiline />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <TextField
          id="cp-success-title"
          label="Succès, titre"
          required
          value={value.successTitle}
          onChange={set("successTitle")}
          error={errors.successTitle}
          max={80}
          hint="*mots* en italique jaune."
        />
        <TextField id="cp-success-text" label="Succès, texte" required value={value.successText} onChange={set("successText")} error={errors.successText} max={320} multiline />
      </div>
    </ContentBlock>
  )
}

function FaqEditor({ initial }: { initial: FaqItems | null }) {
  const [items, setItems] = useState<FaqItems>(initial ?? [])
  const [keys, setKeys] = useState<string[]>(() => (initial ?? []).map((_, i) => `f${i}`))
  const [counter, setCounter] = useState((initial ?? []).length)
  const { save, saving, status, errors } = useContentSave("faq_items")
  return (
    <ContentBlock
      title="Questions fréquentes"
      where="Page /contact, sous l'assistant de devis, et données FAQ pour Google. Section masquée sans question."
      onSubmit={() => save(items, "Questions fréquentes enregistrées.")}
      saving={saving}
      status={status}
    >
      <SortableList
        label="Questions fréquentes"
        itemLabel="la question"
        items={items}
        getKey={(_, i) => keys[i] ?? `f${i}`}
        onMove={(from, to) => {
          setItems((v) => moveItem(v, from, to))
          setKeys((k) => moveItem(k, from, to))
        }}
        actions={(_, i) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Supprimer la question ${i + 1}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              setItems((v) => v.filter((_, j) => j !== i))
              setKeys((k) => k.filter((_, j) => j !== i))
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        renderItem={(item, i) => (
          <div className="space-y-3">
            <TextField
              id={`faq-${i}-q`}
              label="Question"
              required
              value={item.question}
              onChange={(question) => setItems((v) => v.map((x, j) => (j === i ? { ...x, question } : x)))}
              error={errors[`${i}.question`]}
              max={200}
            />
            <TextField
              id={`faq-${i}-a`}
              label="Réponse"
              required
              value={item.answer}
              onChange={(answer) => setItems((v) => v.map((x, j) => (j === i ? { ...x, answer } : x)))}
              error={errors[`${i}.answer`]}
              max={1200}
              multiline
            />
          </div>
        )}
      />
      <Button
        type="button"
        variant="outline"
        disabled={items.length >= MAX_FAQ}
        onClick={() => {
          setItems((v) => [...v, { question: "", answer: "" }])
          setKeys((k) => [...k, `n${counter}`])
          setCounter((c) => c + 1)
        }}
      >
        <Plus className="mr-1.5 h-4 w-4" /> Ajouter une question
      </Button>
    </ContentBlock>
  )
}

// Parametres > Contenu du site > Portfolio
export function PortfolioContentEditor({ params }: { params: Params }) {
  const initial = parseSiteContent("portfolio_page", params.portfolio_page)
  const [value, setValue] = useState<PortfolioPage>(
    initial ?? { kicker: "", title: "", titleAccent: "", lead: "", finalMarquee: "", finalText: "", finalCtaLabel: "" }
  )
  const { save, saving, status, errors } = useContentSave("portfolio_page")
  const set = (key: keyof PortfolioPage) => (v: string) => setValue((prev) => ({ ...prev, [key]: v }))
  return (
    <ContentBlock
      title="Page Portfolio"
      where="Page /portfolio : en-tête et bandeau final vers le formulaire de contact. Les réalisations se gèrent dans le module Portfolio."
      onSubmit={() => save(value, "Page Portfolio enregistrée.")}
      saving={saving}
      status={status}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="pp-kicker" label="Surtitre" value={value.kicker} onChange={set("kicker")} error={errors.kicker} max={60} />
        <TextField id="pp-title" label="Titre" required value={value.title} onChange={set("title")} error={errors.title} max={80} />
        <TextField id="pp-accent" label="Titre, accent" value={value.titleAccent} onChange={set("titleAccent")} error={errors.titleAccent} max={80} />
      </div>
      <TextField id="pp-lead" label="Introduction" value={value.lead} onChange={set("lead")} error={errors.lead} max={320} multiline />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="pp-marquee" label="Bandeau final" required value={value.finalMarquee} onChange={set("finalMarquee")} error={errors.finalMarquee} max={60} hint="*mots* en italique rouge." />
        <TextField id="pp-final-text" label="Texte final" value={value.finalText} onChange={set("finalText")} error={errors.finalText} max={240} />
        <TextField id="pp-cta" label="Bouton final" required value={value.finalCtaLabel} onChange={set("finalCtaLabel")} error={errors.finalCtaLabel} max={40} />
      </div>
    </ContentBlock>
  )
}

// En-tete de la page A propos (en tete de l'onglet A propos)
export function AboutPageEditor({ params }: { params: Params }) {
  const initial = parseSiteContent("about_page", params.about_page)
  const [value, setValue] = useState<AboutPage>(initial ?? { kicker: "", title: "", titleAccent: "", lead: "" })
  const { save, saving, status, errors } = useContentSave("about_page")
  const set = (key: keyof AboutPage) => (v: string) => setValue((prev) => ({ ...prev, [key]: v }))
  return (
    <ContentBlock
      title="En-tête de la page À propos"
      where="Page /a-propos : surtitre, titre et introduction. Histoire, mission, valeurs, équipe et chiffres se règlent ci-dessous."
      onSubmit={() => save(value, "En-tête À propos enregistré.")}
      saving={saving}
      status={status}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="ap-kicker" label="Surtitre" value={value.kicker} onChange={set("kicker")} error={errors.kicker} max={60} />
        <TextField id="ap-title" label="Titre" required value={value.title} onChange={set("title")} error={errors.title} max={80} />
        <TextField id="ap-accent" label="Titre, accent" value={value.titleAccent} onChange={set("titleAccent")} error={errors.titleAccent} max={80} />
      </div>
      <TextField id="ap-lead" label="Introduction" value={value.lead} onChange={set("lead")} error={errors.lead} max={600} multiline rows={4} />
    </ContentBlock>
  )
}
