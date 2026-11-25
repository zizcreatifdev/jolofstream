import type { Metadata } from "next"
import Image from "next/image"

import { prisma } from "@/lib/prisma"
import { getSiteContents } from "@/lib/home-data"
import { aboutStats, aboutValues, paragraphs, realTeam } from "@/lib/about"
import { initialsOf } from "@/lib/testimonials"
import { JsonLd } from "@/components/public/json-ld"
import { CineHeading, Emphasis, Kicker, PAD } from "@/components/public/cine/primitives"

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Jolof Stream, société de captation et de diffusion en direct basée à Dakar : notre histoire, notre mission, nos valeurs et notre équipe.",
}

export const revalidate = 60

const pad = (n: number) => String(n).padStart(2, "0")
const KEYS = ["about_history", "about_mission", "about_values", "about_team", "about_stats", "about_hero_image"]

async function getAboutSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: KEYS } }, select: { key: true, value: true } })
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch {
    return {}
  }
}

export default async function AboutPage() {
  const [contents, settings] = await Promise.all([getSiteContents(["about_page"]), getAboutSettings()])
  const page = contents.about_page
  const history = paragraphs(settings.about_history)
  const mission = (settings.about_mission ?? "").trim()
  const values = aboutValues(settings.about_values)
  const team = realTeam(settings.about_team)
  const stats = aboutStats(settings.about_stats)
  const heroImage = (settings.about_hero_image ?? "").trim()

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "À propos de Jolof Stream",
          url: "https://jolofstream.com/a-propos",
          about: { "@type": "Organization", name: "Jolof Stream", url: "https://jolofstream.com" },
        }}
      />
      {page && (
        <section className={`bg-black pb-[90px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            {page.kicker && <Kicker>{page.kicker}</Kicker>}
            <CineHeading as="h1" title={page.title} accent={page.titleAccent} className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]" />
            {page.lead && <p className="mt-[22px] max-w-[640px] text-[18px] leading-[1.7] text-cine-cream/70">{page.lead}</p>}
            {heroImage && (
              <div className="relative mt-14 aspect-[16/9] w-full overflow-hidden rounded-xl bg-cine-bg3">
                <Image src={heroImage} alt="" fill priority sizes="(min-width: 1440px) 1440px, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {(history.length > 0 || mission) && (
        <section className={`bg-cine-cream py-[96px] text-cine-ink min-[761px]:py-[130px] ${PAD}`}>
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-16">
            {history.length > 0 && (
              <div className="min-w-0 flex-[1_1_420px]">
                <Kicker tone="light">Notre histoire</Kicker>
                <h2 className="sr-only">Notre histoire</h2>
                <div className="mt-6 space-y-[18px]">
                  {history.map((p, i) => (
                    <p key={i} className="text-[19px] leading-[1.75] text-[#4A3B38]">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {mission && (
              <div className="min-w-0 flex-[1_1_420px]">
                <Kicker tone="light">Notre mission</Kicker>
                <h2 className="sr-only">Notre mission</h2>
                <p className="mt-6 font-display text-[clamp(34px,4vw,60px)] leading-[1.08]">
                  <Emphasis text={mission} emClassName="italic text-cine-red" strongClassName="text-cine-red" />
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {values.length > 0 && (
        <section className={`bg-cine-bg py-[96px] text-cine-cream min-[761px]:py-[130px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            <Kicker>Nos valeurs</Kicker>
            <CineHeading title="Ce qui nous" accent="guide." breakLine={false} className="mb-16 mt-[18px] text-[clamp(44px,6vw,96px)]" />
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-px overflow-hidden rounded-xl bg-cine-cream/10">
              {values.map((v, i) => (
                <li key={i} className="bg-cine-bg px-[30px] py-9 transition-colors hover:bg-cine-bg3 motion-reduce:transition-none">
                  <small className="font-mono text-[12px] font-semibold text-cine-red">{pad(i + 1)}</small>
                  <h3 className="mb-3 mt-4 font-display text-[38px] font-normal leading-none">{v.title}</h3>
                  {v.description && <p className="text-[15px] leading-[1.65] text-cine-cream/70">{v.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className={`bg-cine-cream py-[96px] text-cine-ink min-[761px]:py-[130px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            <Kicker tone="light">L’équipe</Kicker>
            <CineHeading title="Les visages" accent="derrière la régie." tone="light" breakLine={false} className="mb-16 mt-[18px] text-[clamp(44px,6vw,96px)]" />
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[18px]">
              {team.map((m, i) => {
                const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
                return (
                  <li key={i} className="overflow-hidden rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
                    <div className="relative flex aspect-square items-center justify-center bg-cine-ink">
                      {m.avatarUrl ? (
                        <Image src={m.avatarUrl} alt={name} width={400} height={400} className="h-full w-full object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex h-32 w-32 items-center justify-center rounded-full bg-cine-cream2 font-mono text-[28px] font-semibold tracking-[0.06em] text-cine-ink">
                          {initialsOf(name)}
                        </span>
                      )}
                    </div>
                    <div className="px-[26px] pb-7 pt-6">
                      {m.role && <small className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cine-red">{m.role}</small>}
                      <h3 className="my-2.5 font-display text-[36px] font-normal leading-none">{name}</h3>
                      {m.bio && <p className="text-[15px] leading-[1.6] text-[#6B5753]">{m.bio}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {stats.length > 0 && (
        <section className={`bg-cine-bg py-[96px] text-cine-cream min-[761px]:py-[130px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            <Kicker>En quelques chiffres</Kicker>
            <CineHeading title="Notre" accent="promesse." breakLine={false} className="mb-16 mt-[18px] text-[clamp(44px,6vw,96px)]" />
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
              {stats.map((s, i) => (
                <div key={i} className="rounded-xl bg-cine-bg3 p-[30px] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[64px] leading-none text-white">{s.value}</dd>
                  <dd aria-hidden="true" className="mt-2.5 text-[14px] leading-[1.55] text-cine-cream/70">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </>
  )
}
