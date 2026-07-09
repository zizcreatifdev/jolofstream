"use client"

import { useState } from "react"
import {
  Building2,
  FileText,
  Globe,
  Mail,
  Plus,
  Scale,
  Share2,
  Trash2,
  User as UserIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  parseJsonField,
  type AboutStat,
  type AboutTeamMember,
  type AboutValue,
  type Testimonial,
} from "@/lib/parametres"
import { cn } from "@/lib/utils"
import { ImageUpload } from "@/components/admin/ui/image-upload"
import { PushSubscribe } from "@/components/admin/push-subscribe"

type SectionKey =
  | "entreprise"
  | "social"
  | "pdf"
  | "content"
  | "legal"
  | "notifications"
  | "profile"

const navItems: Array<{
  key: SectionKey
  label: string
  icon: typeof Building2
}> = [
  { key: "entreprise", label: "Entreprise", icon: Building2 },
  { key: "social", label: "Reseaux sociaux", icon: Share2 },
  { key: "pdf", label: "Documents PDF", icon: FileText },
  { key: "content", label: "Contenu du site", icon: Globe },
  { key: "legal", label: "CGV et Mentions", icon: Scale },
  { key: "notifications", label: "Notifications", icon: Mail },
  { key: "profile", label: "Mon profil", icon: UserIcon },
]

export type ProfileBootstrap = {
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export function ParametresClient({
  initialParams,
  profile,
}: {
  initialParams: Record<string, string>
  profile: ProfileBootstrap
}) {
  const [active, setActive] = useState<SectionKey>("entreprise")
  const [params, setParams] = useState<Record<string, string>>(initialParams)

  const saveParams = async (
    patch: Record<string, string>
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/parametres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        return {
          ok: false,
          error:
            (data && typeof data.error === "string" && data.error) ||
            "Erreur de sauvegarde.",
        }
      }
      setParams((prev) => ({ ...prev, ...patch }))
      return { ok: true }
    } catch {
      return { ok: false, error: "Connexion impossible." }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {active === "entreprise" && (
          <EntrepriseSection params={params} onSave={saveParams} />
        )}
        {active === "social" && (
          <SocialSection params={params} onSave={saveParams} />
        )}
        {active === "pdf" && <PdfSection params={params} onSave={saveParams} />}
        {active === "content" && (
          <ContentSection params={params} onSave={saveParams} />
        )}
        {active === "legal" && (
          <LegalSection params={params} onSave={saveParams} />
        )}
        {active === "notifications" && (
          <NotificationsSection params={params} onSave={saveParams} />
        )}
        {active === "profile" && <ProfileSection profile={profile} />}
      </section>
    </div>
  )
}

type SectionProps = {
  params: Record<string, string>
  onSave: (patch: Record<string, string>) => Promise<{ ok: boolean; error?: string }>
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-6 border-b border-zinc-100 pb-4">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

function SaveBar({
  status,
  saving,
}: {
  status: { message: string; error: boolean } | null
  saving: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
      {status && (
        <p
          className={cn(
            "text-sm",
            status.error ? "text-red-600" : "text-emerald-600"
          )}
        >
          {status.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={saving}
        className="bg-[#C8151B] text-white hover:bg-[#a01015]"
      >
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </div>
  )
}

function EntrepriseSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    company_name: params.company_name ?? "",
    company_legal_form: params.company_legal_form ?? "",
    company_ninea: params.company_ninea ?? "",
    company_rc: params.company_rc ?? "",
    company_address: params.company_address ?? "",
    company_hours: params.company_hours ?? "",
    company_email: params.company_email ?? "",
    company_phone: params.company_phone ?? "",
    company_wave_number: params.company_wave_number ?? "",
    company_wave_link_template: params.company_wave_link_template ?? "",
    company_bank_name: params.company_bank_name ?? "",
    company_bank_iban: params.company_bank_iban ?? "",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const onChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        const result = await onSave(form)
        setSaving(false)
        setStatus(
          result.ok
            ? { message: "Modifications enregistrees.", error: false }
            : { message: result.error ?? "Erreur", error: true }
        )
      }}
    >
      <SectionHeader
        title="Informations de l'entreprise"
        description="Donnees affichees sur les devis, factures, mentions legales et le site public."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="p-name"
          label="Nom de l'entreprise"
          value={form.company_name}
          onChange={(v) => onChange("company_name", v)}
        />
        <Field
          id="p-legal"
          label="Forme juridique"
          value={form.company_legal_form}
          onChange={(v) => onChange("company_legal_form", v)}
        />
        <Field
          id="p-ninea"
          label="NINEA"
          value={form.company_ninea}
          onChange={(v) => onChange("company_ninea", v)}
        />
        <Field
          id="p-rc"
          label="Numero RC"
          value={form.company_rc}
          onChange={(v) => onChange("company_rc", v)}
        />
        <Field
          id="p-email"
          label="Email officiel"
          type="email"
          value={form.company_email}
          onChange={(v) => onChange("company_email", v)}
        />
        <Field
          id="p-phone"
          label="Telephone"
          type="tel"
          value={form.company_phone}
          onChange={(v) => onChange("company_phone", v)}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="p-address"
          label="Adresse du siege"
          value={form.company_address}
          onChange={(v) => onChange("company_address", v)}
        />
        <Field
          id="p-hours"
          label="Horaires d'ouverture"
          placeholder="Lundi - Samedi, 8h - 20h"
          value={form.company_hours}
          onChange={(v) => onChange("company_hours", v)}
          help="Affiche sur la page /contact du site public."
        />
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Paiement
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="p-wave-num"
          label="Numero Wave Business"
          value={form.company_wave_number}
          onChange={(v) => onChange("company_wave_number", v)}
        />
        <Field
          id="p-wave-link"
          label="Lien Wave dynamique"
          placeholder="https://pay.wave.com/m/XXXXX?amount={montant}"
          value={form.company_wave_link_template}
          onChange={(v) => onChange("company_wave_link_template", v)}
          help="Utilisez {montant} comme variable. Le lien est insere dans les emails d'inscription formation."
        />
        <Field
          id="p-bank"
          label="Nom de la banque"
          value={form.company_bank_name}
          onChange={(v) => onChange("company_bank_name", v)}
        />
        <Field
          id="p-iban"
          label="IBAN"
          value={form.company_bank_iban}
          onChange={(v) => onChange("company_bank_iban", v)}
        />
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function SocialSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    social_facebook: params.social_facebook ?? "",
    social_instagram: params.social_instagram ?? "",
    social_youtube: params.social_youtube ?? "",
    social_linkedin: params.social_linkedin ?? "",
    social_tiktok: params.social_tiktok ?? "",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const fields: Array<{ key: keyof typeof form; label: string }> = [
    { key: "social_facebook", label: "Facebook" },
    { key: "social_instagram", label: "Instagram" },
    { key: "social_youtube", label: "YouTube" },
    { key: "social_linkedin", label: "LinkedIn" },
    { key: "social_tiktok", label: "TikTok" },
  ]

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        const result = await onSave(form)
        setSaving(false)
        setStatus(
          result.ok
            ? { message: "Reseaux sociaux mis a jour.", error: false }
            : { message: result.error ?? "Erreur", error: true }
        )
      }}
    >
      <SectionHeader
        title="Reseaux sociaux"
        description="URLs completes. Affichees dans le footer du site public et dans les emails."
      />

      <div className="space-y-4">
        {fields.map((f) => (
          <Field
            key={f.key}
            id={`p-${f.key}`}
            label={f.label}
            type="url"
            placeholder={`https://${f.label.toLowerCase()}.com/...`}
            value={form[f.key]}
            onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function PdfSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    pdf_footer_text: params.pdf_footer_text ?? "",
    pdf_signature_url: params.pdf_signature_url ?? "",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        const result = await onSave(form)
        setSaving(false)
        setStatus(
          result.ok
            ? { message: "PDF mis a jour.", error: false }
            : { message: result.error ?? "Erreur", error: true }
        )
      }}
    >
      <SectionHeader
        title="Documents PDF"
        description="Texte de pied de page applique a tous les devis et factures."
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-pdf-footer">Texte de pied de page</Label>
          <Textarea
            id="p-pdf-footer"
            rows={3}
            value={form.pdf_footer_text}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, pdf_footer_text: e.target.value }))
            }
          />
        </div>
        <ImageUpload
          value={form.pdf_signature_url}
          onChange={(url) =>
            setForm((prev) => ({ ...prev, pdf_signature_url: url }))
          }
          bucket="signatures"
          label="Signature / Tampon"
          hint="Format recommande : PNG transparent, fond transparent, 400x400px. Le tampon sera affiche en carre sur les documents."
          aspectRatio="square-lg"
        />
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function ContentSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    about_history: params.about_history ?? "",
    about_mission: params.about_mission ?? "",
    about_hero_image: params.about_hero_image ?? "",
    hero_background_image: params.hero_background_image ?? "",
    hero_stat_1_value: params.hero_stat_1_value ?? "+200",
    hero_stat_1_label:
      params.hero_stat_1_label ?? "evenements couverts depuis 2020",
    hero_stat_2_value: params.hero_stat_2_value ?? "3",
    hero_stat_2_label: params.hero_stat_2_label ?? "plateformes en simultane",
    hero_stat_3_value: params.hero_stat_3_value ?? "HD",
    hero_stat_3_label: params.hero_stat_3_label ?? "qualite garantie",
  })
  const [values, setValues] = useState<AboutValue[]>(() =>
    parseJsonField<AboutValue[]>(params.about_values, [])
  )
  const [team, setTeam] = useState<AboutTeamMember[]>(() =>
    parseJsonField<AboutTeamMember[]>(params.about_team, [])
  )
  const [stats, setStats] = useState<AboutStat[]>(() =>
    parseJsonField<AboutStat[]>(params.about_stats, [])
  )
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() =>
    parseJsonField<Testimonial[]>(params.testimonials, [])
  )
  const [statusAbout, setStatusAbout] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [statusTest, setStatusTest] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingTest, setSavingTest] = useState(false)

  return (
    <div className="space-y-12">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setSavingAbout(true)
          setStatusAbout(null)
          const result = await onSave({
            about_history: form.about_history,
            about_mission: form.about_mission,
            about_hero_image: form.about_hero_image,
            hero_background_image: form.hero_background_image,
            hero_stat_1_value: form.hero_stat_1_value,
            hero_stat_1_label: form.hero_stat_1_label,
            hero_stat_2_value: form.hero_stat_2_value,
            hero_stat_2_label: form.hero_stat_2_label,
            hero_stat_3_value: form.hero_stat_3_value,
            hero_stat_3_label: form.hero_stat_3_label,
            about_values: JSON.stringify(values),
            about_team: JSON.stringify(team),
            about_stats: JSON.stringify(stats),
          })
          setSavingAbout(false)
          setStatusAbout(
            result.ok
              ? { message: "Page A propos mise a jour.", error: false }
              : { message: result.error ?? "Erreur", error: true }
          )
        }}
      >
        <SectionHeader
          title="Page A propos"
          description="Histoire, mission, valeurs, equipe et chiffres cles affiches sur /a-propos."
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">
              Image de fond - Section Hero
            </label>
            <p className="text-xs text-zinc-500">
              Image discrete en arriere-plan du hero (page d&apos;accueil).
              Recommande : photo de votre equipe en action, evenement filme,
              materiel professionnel. Format : JPG/PNG, 1920x1080px minimum.
              L&apos;opacite est automatiquement reduite pour rester discrete.
            </p>
            <ImageUpload
              value={form.hero_background_image}
              onChange={(url) =>
                setForm((prev) => ({ ...prev, hero_background_image: url }))
              }
              bucket="equipe"
              label=""
              hint="1920x1080px recommande, JPG ou PNG"
              aspectRatio="landscape"
            />
          </div>

          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-700">
                Stats hero (page d&apos;accueil)
              </p>
              <p className="text-xs text-zinc-500">
                3 chiffres cles affiches sous le titre du hero. Valeur courte
                (ex : &quot;+200&quot;, &quot;HD&quot;) et label descriptif.
              </p>
            </div>
            {([1, 2, 3] as const).map((n) => {
              const valueKey = `hero_stat_${n}_value` as const
              const labelKey = `hero_stat_${n}_label` as const
              return (
                <div
                  key={n}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`p-${valueKey}`}>
                      Stat {n} - valeur
                    </Label>
                    <Input
                      id={`p-${valueKey}`}
                      value={form[valueKey]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [valueKey]: e.target.value,
                        }))
                      }
                      placeholder="+200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`p-${labelKey}`}>
                      Stat {n} - libelle
                    </Label>
                    <Input
                      id={`p-${labelKey}`}
                      value={form[labelKey]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [labelKey]: e.target.value,
                        }))
                      }
                      placeholder="evenements couverts"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <ImageUpload
            value={form.about_hero_image}
            onChange={(url) =>
              setForm((prev) => ({ ...prev, about_hero_image: url }))
            }
            bucket="equipe"
            label="Image principale section Qui sommes-nous"
            hint="Format recommande : JPG, ratio 4/3, 800x600px minimum"
            aspectRatio="landscape"
          />
          <div className="space-y-1.5">
            <Label htmlFor="p-about-history">Histoire</Label>
            <Textarea
              id="p-about-history"
              rows={4}
              value={form.about_history}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, about_history: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-about-mission">Mission</Label>
            <Textarea
              id="p-about-mission"
              rows={3}
              value={form.about_mission}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, about_mission: e.target.value }))
              }
            />
          </div>

          <ListEditor
            title="Valeurs"
            items={values}
            onAdd={() =>
              setValues((prev) => [...prev, { title: "", description: "" }])
            }
            onRemove={(i) => setValues((prev) => prev.filter((_, j) => j !== i))}
            renderItem={(item, i) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Titre"
                  value={item.title}
                  onChange={(e) =>
                    setValues((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, title: e.target.value } : it
                      )
                    )
                  }
                />
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    setValues((prev) =>
                      prev.map((it, j) =>
                        j === i
                          ? { ...it, description: e.target.value }
                          : it
                      )
                    )
                  }
                />
              </div>
            )}
          />

          <ListEditor
            title="Equipe"
            items={team}
            onAdd={() =>
              setTeam((prev) => [
                ...prev,
                {
                  firstName: "",
                  lastName: "",
                  role: "",
                  bio: "",
                  avatarUrl: "",
                },
              ])
            }
            onRemove={(i) => setTeam((prev) => prev.filter((_, j) => j !== i))}
            renderItem={(item, i) => (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Prenom"
                    value={item.firstName}
                    onChange={(e) =>
                      setTeam((prev) =>
                        prev.map((it, j) =>
                          j === i ? { ...it, firstName: e.target.value } : it
                        )
                      )
                    }
                  />
                  <Input
                    placeholder="Nom"
                    value={item.lastName}
                    onChange={(e) =>
                      setTeam((prev) =>
                        prev.map((it, j) =>
                          j === i ? { ...it, lastName: e.target.value } : it
                        )
                      )
                    }
                  />
                  <Input
                    placeholder="Role"
                    value={item.role}
                    onChange={(e) =>
                      setTeam((prev) =>
                        prev.map((it, j) =>
                          j === i ? { ...it, role: e.target.value } : it
                        )
                      )
                    }
                  />
                </div>
                <ImageUpload
                  value={item.avatarUrl}
                  onChange={(url) =>
                    setTeam((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, avatarUrl: url } : it
                      )
                    )
                  }
                  bucket="equipe"
                  label="Photo"
                  hint="400x400px recommande"
                  aspectRatio="square"
                />
                <Textarea
                  placeholder="Bio"
                  rows={2}
                  value={item.bio}
                  onChange={(e) =>
                    setTeam((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, bio: e.target.value } : it
                      )
                    )
                  }
                />
              </div>
            )}
          />

          <ListEditor
            title="Chiffres cles"
            items={stats}
            onAdd={() =>
              setStats((prev) => [...prev, { value: "", label: "" }])
            }
            onRemove={(i) => setStats((prev) => prev.filter((_, j) => j !== i))}
            renderItem={(item, i) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Chiffre (ex. 50+)"
                  value={item.value}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, value: e.target.value } : it
                      )
                    )
                  }
                />
                <Input
                  placeholder="Libelle (ex. evenements diffuses)"
                  value={item.label}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, label: e.target.value } : it
                      )
                    )
                  }
                />
              </div>
            )}
          />
        </div>

        <SaveBar status={statusAbout} saving={savingAbout} />
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setSavingTest(true)
          setStatusTest(null)
          const result = await onSave({
            testimonials: JSON.stringify(testimonials),
          })
          setSavingTest(false)
          setStatusTest(
            result.ok
              ? { message: "Temoignages mis a jour.", error: false }
              : { message: result.error ?? "Erreur", error: true }
          )
        }}
      >
        <SectionHeader
          title="Temoignages"
          description="Affiches sur la page Accueil et dans les pages services."
        />

        <ListEditor
          title="Temoignages clients"
          items={testimonials}
          onAdd={() =>
            setTestimonials((prev) => [
              ...prev,
              { name: "", organization: "", text: "", rating: 5 },
            ])
          }
          onRemove={(i) =>
            setTestimonials((prev) => prev.filter((_, j) => j !== i))
          }
          renderItem={(item, i) => (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Nom"
                  value={item.name}
                  onChange={(e) =>
                    setTestimonials((prev) =>
                      prev.map((it, j) =>
                        j === i ? { ...it, name: e.target.value } : it
                      )
                    )
                  }
                />
                <Input
                  placeholder="Organisation"
                  value={item.organization}
                  onChange={(e) =>
                    setTestimonials((prev) =>
                      prev.map((it, j) =>
                        j === i
                          ? { ...it, organization: e.target.value }
                          : it
                      )
                    )
                  }
                />
              </div>
              <Textarea
                placeholder="Texte du temoignage"
                rows={3}
                value={item.text}
                onChange={(e) =>
                  setTestimonials((prev) =>
                    prev.map((it, j) =>
                      j === i ? { ...it, text: e.target.value } : it
                    )
                  )
                }
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-zinc-600">Note /5</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  className="w-20"
                  value={item.rating}
                  onChange={(e) =>
                    setTestimonials((prev) =>
                      prev.map((it, j) =>
                        j === i
                          ? { ...it, rating: Number(e.target.value) || 5 }
                          : it
                      )
                    )
                  }
                />
              </div>
            </div>
          )}
        />

        <SaveBar status={statusTest} saving={savingTest} />
      </form>
    </div>
  )
}

function LegalSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    cgv_content: params.cgv_content ?? "",
    mentions_legales_content: params.mentions_legales_content ?? "",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        const result = await onSave(form)
        setSaving(false)
        setStatus(
          result.ok
            ? { message: "Documents legaux mis a jour.", error: false }
            : { message: result.error ?? "Erreur", error: true }
        )
      }}
    >
      <SectionHeader
        title="CGV et Mentions legales"
        description="Affiches sur /cgv et /mentions-legales du site public."
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-cgv">Conditions Generales de Vente</Label>
          <Textarea
            id="p-cgv"
            rows={12}
            value={form.cgv_content}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cgv_content: e.target.value }))
            }
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-mentions">Mentions Legales</Label>
          <Textarea
            id="p-mentions"
            rows={10}
            value={form.mentions_legales_content}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                mentions_legales_content: e.target.value,
              }))
            }
            className="font-mono text-sm"
          />
        </div>
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function NotificationsSection({ params, onSave }: SectionProps) {
  const [form, setForm] = useState({
    admin1_email: params.admin1_email ?? "",
    admin2_email: params.admin2_email ?? "",
    invoice_alert_days: params.invoice_alert_days ?? "30",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        const result = await onSave(form)
        setSaving(false)
        setStatus(
          result.ok
            ? { message: "Notifications mises a jour.", error: false }
            : { message: result.error ?? "Erreur", error: true }
        )
      }}
    >
      <SectionHeader
        title="Notifications"
        description="Emails admins pour les leads/inscriptions, delai d'alerte des impayes."
      />

      <div className="space-y-4">
        <Field
          id="p-admin1"
          label="Email admin 1"
          type="email"
          value={form.admin1_email}
          onChange={(v) => setForm((prev) => ({ ...prev, admin1_email: v }))}
        />
        <Field
          id="p-admin2"
          label="Email admin 2"
          type="email"
          value={form.admin2_email}
          onChange={(v) => setForm((prev) => ({ ...prev, admin2_email: v }))}
        />
        <div className="space-y-1.5">
          <Label htmlFor="p-alert-days">Delai d&apos;alerte factures impayees</Label>
          <Select
            value={form.invoice_alert_days}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, invoice_alert_days: v }))
            }
          >
            <SelectTrigger id="p-alert-days" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="45">45 jours</SelectItem>
              <SelectItem value="60">60 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function ProfileSection({ profile }: { profile: ProfileBootstrap }) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl ?? "",
    newPassword: "",
    confirmPassword: "",
  })
  const [status, setStatus] = useState<{
    message: string
    error: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        try {
          const response = await fetch("/api/profil", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
          if (!response.ok) {
            const data = await response.json().catch(() => null)
            setStatus({
              message:
                (data && typeof data.error === "string" && data.error) ||
                "Echec de la mise a jour.",
              error: true,
            })
          } else {
            setStatus({
              message: "Profil mis a jour. Reconnectez-vous pour voir les changements.",
              error: false,
            })
            setForm((prev) => ({
              ...prev,
              newPassword: "",
              confirmPassword: "",
            }))
          }
        } catch {
          setStatus({ message: "Connexion impossible.", error: true })
        } finally {
          setSaving(false)
        }
      }}
    >
      <SectionHeader
        title="Mon profil"
        description="Modifiez votre nom, votre avatar et votre mot de passe. L'email n'est pas modifiable."
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="p-fn"
            label="Prenom"
            value={form.firstName}
            onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))}
          />
          <Field
            id="p-ln"
            label="Nom"
            value={form.lastName}
            onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-email-ro">Email</Label>
          <Input id="p-email-ro" value={profile.email} disabled />
        </div>
        <Field
          id="p-avatar"
          label="URL de l'avatar (manuel)"
          type="url"
          placeholder="https://..."
          value={form.avatarUrl}
          onChange={(v) => setForm((prev) => ({ ...prev, avatarUrl: v }))}
          help="Ou utilisez l'upload ci-dessous pour heberger sur Supabase Storage."
        />
        <ImageUpload
          value={form.avatarUrl}
          onChange={(url) =>
            setForm((prev) => ({ ...prev, avatarUrl: url }))
          }
          bucket="avatars"
          label="Photo de profil"
          hint="Format recommande : JPG ou PNG, 400x400px minimum"
          aspectRatio="square"
        />

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Notifications push
        </h3>
        <PushSubscribe />

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Changer le mot de passe
        </h3>
        <p className="text-xs text-zinc-500">
          Laissez vide pour ne pas modifier. Minimum 8 caracteres.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="p-newpass"
            label="Nouveau mot de passe"
            type="password"
            value={form.newPassword}
            onChange={(v) => setForm((prev) => ({ ...prev, newPassword: v }))}
          />
          <Field
            id="p-confpass"
            label="Confirmer mot de passe"
            type="password"
            value={form.confirmPassword}
            onChange={(v) =>
              setForm((prev) => ({ ...prev, confirmPassword: v }))
            }
          />
        </div>
      </div>

      <SaveBar status={status} saving={saving} />
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  help,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  help?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <p className="text-xs text-zinc-500">{help}</p>}
    </div>
  )
}

function ListEditor<T>({
  title,
  items,
  onAdd,
  onRemove,
  renderItem,
}: {
  title: string
  items: T[]
  onAdd: () => void
  onRemove: (index: number) => void
  renderItem: (item: T, index: number) => React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-700">{title}</h4>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-xs text-zinc-500">
          Aucun element. Cliquez sur Ajouter.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-md border border-zinc-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(i)}
                  className="text-red-600 hover:bg-red-50"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {renderItem(item, i)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

