import type { Metadata } from "next"
import Image from "next/image"

import { getSiteContents } from "@/lib/home-data"
import { FORMATIONS_PAGE_DEFAULT, withDelay } from "@/lib/site-content"
import { getProgramTestimonials, getPublicProgramsSafe, type PublicProgram } from "@/lib/formations-public"
import { getPaymentDelayHours } from "@/lib/training-delay"
import { paymentDelayLabel } from "@/lib/cohort-public"
import { initialsOf, type TestimonialView } from "@/lib/testimonials"
import { JsonLd } from "@/components/public/json-ld"
import { CineButton, CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"
import { ProgramBlock } from "@/components/public/formations/program-block"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.com").replace(/\/+$/, "")

function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

// Titre et description depuis le premier programme visible
export async function generateMetadata(): Promise<Metadata> {
  const programs = await getPublicProgramsSafe()
  const first = programs[0]
  if (!first) {
    return pageMetadata({ title: "Formations", description: "Formations à la captation et à la réalisation en direct, à Dakar.", path: "/formations" })
  }
  const description = clip([first.tagline, first.description].filter(Boolean).join(" ") || first.name)
  return pageMetadata({ title: `Formations : ${first.name}`, description, path: "/formations" })
}

// schema.org Course par programme, une instance par cohorte datee
function courseJsonLd(program: PublicProgram) {
  const instances = program.cohorts
    .filter((c) => c.dateStart)
    .map((c) => ({
      "@type": "CourseInstance",
      name: c.name,
      courseMode: "onsite",
      startDate: c.dateStart,
      ...(c.dateEnd ? { endDate: c.dateEnd } : {}),
      location: { "@type": "Place", name: c.location, address: { "@type": "PostalAddress", addressLocality: c.location, addressCountry: "SN" } },
      offers: {
        "@type": "Offer",
        price: c.price,
        priceCurrency: "XOF",
        availability: c.status === "full" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: `${SITE_URL}/formations/reserver?f=${program.slug}&c=${c.id}`,
      },
    }))
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.name,
    description: program.description || program.tagline || program.name,
    url: `${SITE_URL}/formations#${program.slug}`,
    ...(program.code ? { courseCode: program.code } : {}),
    provider: { "@type": "Organization", name: "Jolof Stream", url: SITE_URL },
    ...(instances.length ? { hasCourseInstance: instances } : {}),
  }
}

export default async function FormationsPage() {
  const [contents, programs, delayHours] = await Promise.all([
    getSiteContents(["formations_page"]),
    getPublicProgramsSafe(),
    getPaymentDelayHours(),
  ])
  const page = contents.formations_page ?? FORMATIONS_PAGE_DEFAULT
  const testimonials = await getProgramTestimonials(programs.map((p) => p.id))
  const delay = paymentDelayLabel(delayHours)
  const alumni = programs.filter((p) => (testimonials[p.id] ?? []).length > 0)

  return (
    <>
      {programs.map((p) => (
        <JsonLd key={p.id} data={courseJsonLd(p)} />
      ))}

      <section className={`bg-black pb-[110px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          {page.kicker && <Kicker>{page.kicker}</Kicker>}
          <CineHeading
            as="h1"
            title={page.title}
            accent={page.titleAccent}
            className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]"
          />
          {page.lead && (
            <p className="mt-[22px] max-w-[560px] text-[18px] leading-[1.7] text-cine-cream/70">{page.lead}</p>
          )}
        </div>
      </section>

      <section className={`bg-cine-cream py-[96px] text-cine-ink min-[761px]:py-[130px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-7">
            <div>
              {page.listKicker && <Kicker tone="light">{page.listKicker}</Kicker>}
              <CineHeading
                title={page.listTitle}
                accent={page.listTitleAccent}
                tone="light"
                breakLine={false}
                className="mt-[18px] text-[clamp(44px,6vw,96px)]"
              />
            </div>
            {page.listLead && programs.length > 0 && (
              <p className="max-w-[460px] text-[17px] leading-[1.7] text-[#5B4A46]">{page.listLead}</p>
            )}
          </div>

          {programs.length === 0 ? (
            <div className="rounded-xl bg-white p-[clamp(28px,4vw,48px)] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]">
              <p className="font-display text-[clamp(32px,4vw,48px)] leading-none">Aucune formation en ligne pour le moment.</p>
              <p className="mb-6 mt-4 max-w-[560px] text-[16px] leading-[1.7] text-[#5B4A46]">
                Les prochaines dates sont en préparation. Écrivez-nous pour être prévenu de l&apos;ouverture des inscriptions.
              </p>
              <CineButton href="/contact" variant="red" arrow>
                Nous contacter
              </CineButton>
            </div>
          ) : (
            programs.map((program, i) => <ProgramBlock key={program.id} program={program} first={i === 0} />)
          )}

          {alumni.map((program) => (
            <AlumniSection
              key={program.id}
              program={program}
              testimonials={testimonials[program.id]}
              kicker={page.alumniKicker}
              title={page.alumniTitle}
              accent={page.alumniTitleAccent}
            />
          ))}

          <div className="mt-[18px] flex flex-wrap items-center justify-between gap-6 rounded-xl bg-cine-ink p-[clamp(28px,4vw,40px)] text-cine-cream">
            <div>
              {page.soonKicker && <Kicker>{page.soonKicker}</Kicker>}
              <h2 className="mt-3 font-display text-[clamp(34px,4vw,44px)] font-normal leading-none">{page.soonTitle}</h2>
            </div>
            <CineButton href="/contact?besoin=formation-entreprise" variant="outDark" arrow>
              {page.soonCta}
            </CineButton>
          </div>
        </div>
      </section>

      <section className={`bg-cine-bg py-[96px] text-cine-cream min-[761px]:py-[130px] ${PAD}`}>
        <div className="mx-auto max-w-[1440px]">
          {page.flowKicker && <Kicker>{page.flowKicker}</Kicker>}
          <CineHeading
            title={page.flowTitle}
            accent={page.flowTitleAccent}
            breakLine={false}
            className="mt-[18px] text-[clamp(44px,6vw,96px)]"
          />
          <ol className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
            {page.steps.map((step, i) => (
              <li key={i} className="rounded-[10px] bg-cine-bg3 p-[26px] shadow-[inset_0_0_0_1px_rgba(244,240,234,0.08)]">
                <b aria-hidden="true" className="mb-3 block font-display text-[58px] font-normal leading-none text-cine-red">
                  {i + 1}
                </b>
                <strong className="mb-1.5 block text-[17px]">{step.title}</strong>
                <span className="text-[14px] leading-[1.6] text-cine-cream/65">{withDelay(step.text, delay)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}

function AlumniSection({
  program,
  testimonials,
  kicker,
  title,
  accent,
}: {
  program: PublicProgram
  testimonials: TestimonialView[]
  kicker: string
  title: string
  accent: string
}) {
  const kick = [kicker, program.code ?? program.name].filter(Boolean).join(" · ")
  return (
    <section aria-label={`${title} ${accent} : ${program.name}`} className="mt-14 border-t border-cine-ink/10 pt-12">
      <div className="mb-7">
        {kick && <Kicker tone="light">{kick}</Kicker>}
        <CineHeading
          title={title}
          accent={accent}
          tone="light"
          breakLine={false}
          className="mt-[18px] text-[clamp(40px,5vw,72px)]"
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="m-0 flex flex-col gap-[22px] rounded-xl bg-white p-[34px] shadow-[inset_0_0_0_1px_rgba(26,17,16,0.08)]"
          >
            {t.photoUrl ? (
              <Image src={t.photoUrl} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cine-cream2 font-mono text-[13px] font-semibold tracking-[0.06em] text-cine-ink"
              >
                {initialsOf(t.authorName)}
              </span>
            )}
            <blockquote className="m-0 flex-1 text-[16px] leading-[1.65] text-[#5B4A46]">{t.quote}</blockquote>
            <figcaption>
              <strong className="block text-[16px] text-cine-ink">{t.authorName}</strong>
              {t.authorRole && <span className="text-[13px] text-[#7A6660]">{t.authorRole}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
