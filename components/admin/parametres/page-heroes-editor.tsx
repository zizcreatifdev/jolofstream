"use client"

import { useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  FORMATIONS_PAGE_DEFAULT,
  PAGE_HERO_FOCALS,
  PAGE_HERO_KEYS,
  PAGE_HERO_LABELS,
  parseSiteContent,
  type PageHero,
  type PageHeroFocal,
  type PageHeroKey,
  type PageHeroes,
} from "@/lib/site-content"
import { PAGE_HERO_POSITION, PAGE_HERO_SCRIM } from "@/components/public/cine/page-hero-style"
import { sceneKicker, sceneLabel } from "@/lib/site-nav"
import { prepareHeaderImage, extensionFor } from "@/lib/image-resize"
import { putToSignedUrl, requestSignedUpload } from "@/lib/signed-upload-client"
import { uploadRule } from "@/lib/storage-buckets"

type Params = Record<string, string>

// Titre affiché dans l'aperçu : contenu de la page correspondante
function pageTexts(key: PageHeroKey, params: Params): { kicker: string; title: string; accent: string } {
  const pick = (c: { kicker?: string; title: string; titleAccent?: string } | null) =>
    c ? { kicker: c.kicker ?? "", title: c.title, accent: c.titleAccent ?? "" } : { kicker: "", title: PAGE_HERO_LABELS[key], accent: "" }
  switch (key) {
    case "services":
      return pick(parseSiteContent("services_page", params.services_page))
    case "formations":
      return pick(parseSiteContent("formations_page", params.formations_page) ?? FORMATIONS_PAGE_DEFAULT)
    case "portfolio":
      return pick(parseSiteContent("portfolio_page", params.portfolio_page))
    case "galerie":
      return pick(parseSiteContent("galerie_page", params.galerie_page))
    case "a-propos":
      return pick(parseSiteContent("about_page", params.about_page))
    case "contact":
      return pick(parseSiteContent("contact_page", params.contact_page))
  }
}

// Paramètres > Contenu du site > En-têtes de pages
export function PageHeroesEditor({ params }: { params: Params }) {
  const [saved, setSaved] = useState<PageHeroes>(() => parseSiteContent("page_heroes", params.page_heroes) ?? {})

  const persist = async (next: PageHeroes): Promise<string | null> => {
    const response = await fetch("/api/site-content/page_heroes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => null)
    const data = await response?.json().catch(() => null)
    if (!response?.ok) {
      const issue = Array.isArray(data?.issues) ? data.issues[0]?.message : null
      return issue || (data && typeof data.error === "string" && data.error) || "Enregistrement impossible."
    }
    setSaved((data?.value as PageHeroes) ?? next)
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">En-têtes de pages</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Une image plein cadre en haut de chaque page. Sans image, la page garde son en-tête sur fond noir. Les
          pages légales ne sont pas concernées.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {PAGE_HERO_KEYS.map((key) => (
          <PageHeroCard
            key={key}
            pageKey={key}
            texts={pageTexts(key, params)}
            hero={saved[key] ?? null}
            onPersist={(hero) => {
              const next: PageHeroes = { ...saved }
              if (hero) next[key] = hero
              else delete next[key]
              return persist(next)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PageHeroCard({
  pageKey,
  texts,
  hero,
  onPersist,
}: {
  pageKey: PageHeroKey
  texts: { kicker: string; title: string; accent: string }
  hero: PageHero | null
  onPersist: (hero: PageHero | null) => Promise<string | null>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focal, setFocal] = useState<PageHeroFocal>(hero?.focal ?? "center")
  const [alt, setAlt] = useState(hero?.alt ?? "")
  const [busy, setBusy] = useState<null | "upload" | "save" | "remove">(null)
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null)
  const id = `entete-${pageKey}`
  const rule = uploadRule({ bucket: "hero", kind: "header" })

  const upload = async (file: File) => {
    setStatus(null)
    setBusy("upload")
    try {
      const image = await prepareHeaderImage(file)
      if (image.blob.size > rule.maxBytes) throw new Error("Image trop lourde après redimensionnement (1 Mo maximum).")
      const signed = await requestSignedUpload({
        bucket: "hero",
        kind: "header",
        fileName: `${pageKey}.${extensionFor(image.type)}`,
        contentType: image.type,
        size: image.blob.size,
      })
      await putToSignedUrl(signed, image.blob)
      const error = await onPersist({ imageUrl: signed.publicUrl, imagePath: signed.path, focal, alt })
      setStatus(error ? { error: true, text: error } : { error: false, text: hero ? "Image remplacée (l'ancienne est supprimée)." : "Image ajoutée." })
    } catch (error) {
      setStatus({ error: true, text: error instanceof Error ? error.message : "Téléversement impossible." })
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const saveSettings = async () => {
    if (!hero) return
    setBusy("save")
    const error = await onPersist({ ...hero, focal, alt })
    setBusy(null)
    setStatus(error ? { error: true, text: error } : { error: false, text: "Cadrage et texte alternatif enregistrés." })
  }

  const remove = async () => {
    setBusy("remove")
    const error = await onPersist(null)
    setBusy(null)
    setStatus(error ? { error: true, text: error } : { error: false, text: "Image retirée : l'en-tête d'origine est rétabli." })
  }

  return (
    <section aria-labelledby={`${id}-titre`} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 id={`${id}-titre`} className="text-base font-semibold text-zinc-900">
        {PAGE_HERO_LABELS[pageKey]} <span className="text-sm font-normal text-zinc-500">/{pageKey}</span>
      </h3>

      {/* Aperçu de l'en-tête tel qu'il apparaîtra */}
      <div className="relative aspect-[16/8] overflow-hidden rounded-lg bg-[#050303]" aria-label={`Aperçu de l'en-tête ${PAGE_HERO_LABELS[pageKey]}`} role="img">
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.imageUrl} alt="" className={cn("absolute inset-0 h-full w-full object-cover", PAGE_HERO_POSITION[focal])} />
            <span aria-hidden="true" className={cn("absolute inset-0", PAGE_HERO_SCRIM)} />
          </>
        ) : (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Sans image : fond noir
          </span>
        )}
        <span className="absolute inset-x-4 bottom-4 block">
          <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#F5B800]">
            {sceneKicker(`/${pageKey}`, texts.kicker || sceneLabel(pageKey))}
          </span>
          <span className="mt-1 block font-serif text-[clamp(20px,3vw,34px)] leading-none text-[#F4F0EA]">
            {texts.title} {texts.accent && <em className="italic text-[#F5B800]">{texts.accent}</em>}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={`${id}-fichier`}
          type="file"
          aria-label={`Image d'en-tête de la page ${PAGE_HERO_LABELS[pageKey]}`}
          accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => inputRef.current?.click()} className="min-h-[44px]">
          {busy === "upload" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />}
          {hero ? "Remplacer" : "Ajouter une image"}
        </Button>
        {hero && (
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void remove()}
            className="min-h-[44px] border-red-200 text-red-700 hover:bg-red-50"
          >
            {busy === "remove" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            Retirer
          </Button>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        JPG, PNG ou WebP, paysage de préférence : redimensionnée à 2 400 px à l&apos;envoi, {rule.label.replace("JPG ou WebP, ", "")} après traitement.
      </p>

      <fieldset className="space-y-1.5" disabled={!hero}>
        <legend className="text-sm font-medium text-zinc-900">Point de cadrage</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAGE_HERO_FOCALS) as PageHeroFocal[]).map((f) => (
            <label
              key={f}
              className={cn(
                "inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-sm",
                focal === f ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700",
                !hero && "cursor-not-allowed opacity-50"
              )}
            >
              <input type="radio" name={`${id}-cadrage`} value={f} checked={focal === f} onChange={() => setFocal(f)} className="sr-only" />
              {PAGE_HERO_FOCALS[f]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-alt`}>Texte alternatif</Label>
        <Input id={`${id}-alt`} value={alt} maxLength={200} disabled={!hero} onChange={(e) => setAlt(e.target.value)} placeholder="Décrivez l'image (vide : image décorative)" />
      </div>
      {hero && (
        <Button type="button" onClick={() => void saveSettings()} disabled={busy !== null} className="min-h-[44px] bg-[#C8151B] text-white hover:bg-[#a51217]">
          {busy === "save" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
          Enregistrer le cadrage
        </Button>
      )}
      {status && (
        <p role={status.error ? "alert" : "status"} className={cn("text-sm", status.error ? "text-red-600" : "text-emerald-700")}>
          {status.text}
        </p>
      )}
    </section>
  )
}
