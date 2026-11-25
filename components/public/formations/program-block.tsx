import Link from "next/link"
import { ArrowRight, Check, Download, ExternalLink, Mail, Phone, Plus } from "lucide-react"

import { formatFcfa } from "@/lib/cohort-public"
import type { PublicProgram } from "@/lib/formations-public"
import type { ProgramAlbum } from "@/lib/gallery-public"
import { CineButton, Kicker } from "@/components/public/cine/primitives"
import { COHORT_ROW_CLASS, CohortRowContent, cohortRowTone } from "@/components/public/formations/cohort-row"

const pad = (n: number) => String(n).padStart(2, "0")

export function reserveHref(slug: string, cohortId?: string): string {
  return `/formations/reserver?f=${encodeURIComponent(slug)}${cohortId ? `&c=${encodeURIComponent(cohortId)}` : ""}`
}

function Accordion({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group mb-6 border-t border-cine-ink/10">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {summary}
        <Plus
          className="h-[18px] w-[18px] shrink-0 text-cine-red transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      {children}
    </details>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mb-2 flex flex-col gap-[9px] text-[14px] text-[#5B4A46]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-cine-red" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )
}

const TAG = "inline-block rounded-md bg-cine-cream2 px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B5753]"

// Bloc d'un programme sur /formations (maquette .fm) : fiche a gauche,
// chiffres cles et cohortes a droite. Tout bloc vide est masque.
export function ProgramBlock({
  program,
  first,
  album,
}: {
  program: PublicProgram
  first: boolean
  album?: ProgramAlbum | null
}) {
  const kicker = [
    program.code,
    program.sessionsCount ? `${program.sessionsCount} séance${program.sessionsCount > 1 ? "s" : ""}` : null,
    program.seatsPerCohort ? `${program.seatsPerCohort} places par cohorte` : null,
  ].filter(Boolean)
  const tags = [
    program.theoryHours ? `${program.theoryHours} h de théorie` : null,
    program.practiceHours ? `${program.practiceHours} h de pratique` : null,
    program.level,
    program.minPrice !== null ? `À partir de ${formatFcfa(program.minPrice)}` : null,
  ].filter((t): t is string => Boolean(t))
  const phoneHref = program.contactPhone ? `tel:${program.contactPhone.replace(/[^\d+]/g, "")}` : null

  return (
    <article
      id={program.slug}
      aria-labelledby={`${program.slug}-titre`}
      className={`flex scroll-mt-[90px] flex-wrap gap-12 border-cine-ink/10 py-16 ${first ? "pt-2" : "border-t"}`}
    >
      <div className="min-w-0 flex-[1_1_340px]">
        {kicker.length > 0 && <Kicker tone="light">{kicker.join(" · ")}</Kicker>}
        <h3
          id={`${program.slug}-titre`}
          className="my-4 font-display text-[clamp(44px,4.6vw,72px)] font-normal leading-[0.95] tracking-[-0.025em]"
        >
          {program.name}
        </h3>
        {program.tagline && <p className="mb-3 text-[17px] font-semibold text-cine-ink">{program.tagline}</p>}
        {program.description && (
          <p className="mb-5 text-[16px] leading-[1.7] text-[#5B4A46]">{program.description}</p>
        )}
        {program.disciplines.length > 0 && (
          <ul className="mb-[22px] flex flex-wrap gap-2" aria-label="Disciplines">
            {program.disciplines.map((d, i) => (
              <li
                key={i}
                className="rounded-lg bg-cine-ink px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-cine-cream"
              >
                {pad(i + 1)} {d}
              </li>
            ))}
          </ul>
        )}
        {tags.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label="En bref">
            {tags.map((t) => (
              <li key={t} className={TAG}>
                {t}
              </li>
            ))}
          </ul>
        )}

        {program.brochure && (
          <div className="mb-[26px] flex flex-wrap items-center gap-x-[18px] gap-y-4 rounded-xl bg-white p-[18px] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
            <span
              aria-hidden="true"
              className="flex h-[60px] w-12 shrink-0 items-end justify-center rounded-[5px] bg-cine-ink pb-[9px] font-mono text-[10px] font-semibold tracking-[0.1em] text-cine-cream"
            >
              PDF
            </span>
            <span className="min-w-0 flex-[1_1_170px]">
              <strong className="mb-[5px] block text-[16px]">{program.brochure.title}</strong>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7A6660]">
                {program.brochure.meta}
              </span>
            </span>
            <span className="flex flex-wrap gap-2">
              <a
                href={program.brochure.href}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-cine-bg px-[18px] text-[14px] font-semibold text-white transition-colors hover:bg-black"
              >
                Télécharger <Download className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={program.brochure.viewHref}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-[18px] text-[14px] font-semibold text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.25)] transition-colors hover:bg-cine-ink hover:text-white"
              >
                Lire en ligne <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </span>
          </div>
        )}

        {program.curriculum.length > 0 && (
          <Accordion summary={`Déroulé des ${program.curriculum.length} séances`}>
            <ol className="mb-2">
              {program.curriculum.map((s, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-2.5 gap-y-[3px] border-t border-cine-ink/[0.07] py-3 first:border-t-0 first:pt-0.5"
                >
                  <b className="pt-[3px] font-mono text-[12px] font-semibold text-cine-red">{pad(i + 1)}</b>
                  <strong className="text-[15px] font-semibold">{s.title}</strong>
                  {s.mode && <span className="col-start-2 text-[13px] text-[#6B5753]">{s.mode}</span>}
                  {s.content.length > 0 && (
                    <ul className="col-start-2 mt-1.5 list-disc space-y-1 pl-4 text-[13px] text-[#5B4A46] marker:text-cine-red">
                      {s.content.map((c, k) => (
                        <li key={k}>{c}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Accordion>
        )}
        {program.objectives.length > 0 && (
          <Accordion summary="Objectifs">
            <CheckList items={program.objectives} />
          </Accordion>
        )}
        {program.audience && (
          <Accordion summary="Pour qui">
            <CheckList items={[program.audience]} />
          </Accordion>
        )}
        {program.leadName && (
          <p className="mb-[22px] text-[14px] leading-[1.6] text-[#5B4A46]">
            Responsable pédagogique : <b className="text-cine-ink">{program.leadName}</b>
            {program.leadRole ? `, ${program.leadRole}` : ""}.
          </p>
        )}
        {(program.contactEmail || phoneHref) && (
          <div className="flex flex-wrap gap-2 text-[14px]">
            <span className="sr-only">Contact de la formation :</span>
            {program.contactEmail && (
              <a
                href={`mailto:${program.contactEmail}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.15)] hover:bg-white"
              >
                <Mail className="h-4 w-4 text-cine-red" aria-hidden="true" /> {program.contactEmail}
              </a>
            )}
            {phoneHref && (
              <a
                href={phoneHref}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-cine-ink shadow-[inset_0_0_0_1px_rgba(26,17,16,0.15)] hover:bg-white"
              >
                <Phone className="h-4 w-4 text-cine-red" aria-hidden="true" /> {program.contactPhone}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-[1.6_1_520px] flex-col gap-2.5">
        {program.stats.length > 0 && (
          <dl className="mb-[18px] grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {program.stats.map((s, i) => (
              <div
                key={i}
                className="flex items-baseline gap-3.5 rounded-xl bg-white p-[18px] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)] sm:block"
              >
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-[36px] leading-none tracking-[-0.02em] sm:text-[46px]">{s.value}</dd>
                <dd aria-hidden="true" className="text-[13px] leading-[1.45] text-[#6B5753] sm:mt-2">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {program.cohorts.length > 0 ? (
          <>
            <h4 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6B5753]">
              Cohortes · choisissez la vôtre
            </h4>
            <ul className="flex flex-col gap-2.5">
              {program.cohorts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={reserveHref(program.slug, c.id)}
                    className={`${COHORT_ROW_CLASS} ${cohortRowTone(c)}`}
                  >
                    <CohortRowContent cohort={c} headingLevel="span" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-xl bg-white p-7 shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
            <p className="font-display text-[32px] leading-none">Prochaines dates bientôt</p>
            <p className="mb-5 mt-3 text-[15px] text-[#5B4A46]">
              Aucune cohorte n&apos;est ouverte pour le moment. Écrivez-nous pour être prévenu.
            </p>
            <CineButton href="/contact" variant="outLight" arrow>
              Nous contacter
            </CineButton>
          </div>
        )}
      </div>
      {album && album.photos.length > 0 && (
        <div className="w-full basis-full">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h4 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6B5753]">
              En images · {album.title}
            </h4>
            <Link
              href={`/galerie/${album.slug}`}
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-cine-ink underline underline-offset-4 hover:text-cine-red"
            >
              Voir l&apos;album
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-2 min-[761px]:grid-cols-6">
            {album.photos.map((photo) => (
              <li key={photo.id}>
                <Link href={`/galerie/${album.slug}`} className="block aspect-square overflow-hidden rounded-md bg-cine-cream2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
