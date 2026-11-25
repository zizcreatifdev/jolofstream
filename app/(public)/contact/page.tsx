import type { Metadata } from "next"
import { Suspense } from "react"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { getSiteContents } from "@/lib/home-data"
import { getSiteContact, type SiteSocial } from "@/lib/site-settings"
import { JsonLd } from "@/components/public/json-ld"
import { CineHeading, Kicker, PAD } from "@/components/public/cine/primitives"
import { QuoteWizard } from "@/components/public/contact/quote-wizard"
import { FaqSection } from "@/components/public/contact/faq-section"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/public/social-icons"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Demandez un devis en trois étapes : événement en direct, CEO Content, Creator Weekend, formation. Réponse sous 24h. Jolof Stream, Dakar.",
  path: "/contact",
})

const SOCIAL_ICONS: Record<SiteSocial["key"], typeof FacebookIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  tiktok: TiktokIcon,
}

const LINK = "flex min-h-[44px] items-center gap-3.5 text-[18px] text-cine-cream transition-colors hover:text-cine-yellow"

export default async function ContactPage() {
  const [contents, contact] = await Promise.all([getSiteContents(["contact_page", "faq_items"]), getSiteContact()])
  const page = contents.contact_page
  const faq = contents.faq_items ?? []

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: contact.companyName,
          url: "https://jolofstream.com",
          ...(contact.phone ? { telephone: contact.phoneHref } : {}),
          ...(contact.email ? { email: contact.email } : {}),
          ...(contact.address ? { address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "SN" } } : {}),
          priceRange: "Sur devis",
        }}
      />
      {faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}

      {page && (
        <section className={`bg-black pb-[90px] pt-[180px] text-cine-cream min-[761px]:pt-[210px] ${PAD}`}>
          <div className="mx-auto max-w-[1440px]">
            {page.kicker && <Kicker>{page.kicker}</Kicker>}
            <CineHeading as="h1" title={page.title} accent={page.titleAccent} className="mt-[22px] text-[clamp(56px,9vw,150px)] leading-[0.88]" />
            {page.lead && <p className="mt-[22px] max-w-[560px] text-[18px] leading-[1.7] text-cine-cream/70">{page.lead}</p>}
          </div>
        </section>
      )}

      <section className={`bg-cine-bg pb-[110px] pt-[90px] text-cine-cream ${PAD}`}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-14">
          <div className="min-w-0 flex-[1_1_320px] min-[1000px]:sticky min-[1000px]:top-[120px]">
            <Kicker>Nous joindre</Kicker>
            <ul className="mt-[30px] flex flex-col gap-2">
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phoneHref}`} className={LINK}>
                    <Phone className="h-5 w-5 shrink-0 text-cine-red" aria-hidden="true" /> {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className={`${LINK} break-all`}>
                    <Mail className="h-5 w-5 shrink-0 text-cine-red" aria-hidden="true" /> {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex min-h-[44px] items-center gap-3.5 text-[18px]">
                  <MapPin className="h-5 w-5 shrink-0 text-cine-red" aria-hidden="true" /> {contact.address}
                </li>
              )}
              {contact.hours && (
                <li className="flex min-h-[44px] items-center gap-3.5 text-[16px] text-cine-cream/80">
                  <Clock className="h-5 w-5 shrink-0 text-cine-red" aria-hidden="true" /> {contact.hours}
                </li>
              )}
            </ul>
            {contact.socials.length > 0 && (
              <ul aria-label="Réseaux sociaux" className="mt-6 flex flex-wrap gap-2">
                {contact.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.key]
                  return (
                    <li key={social.key}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} (nouvel onglet)`}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-cine-cream shadow-[inset_0_0_0_1px_rgba(244,240,234,0.25)] transition-colors hover:bg-cine-cream hover:text-cine-bg"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
            {page?.zoneText && <p className="mt-[30px] max-w-[340px] text-[15px] leading-[1.7] text-cine-cream/65">{page.zoneText}</p>}
          </div>
          <div className="min-w-0 flex-[1.7_1_560px]">
            <h2 className="sr-only">Demande de devis</h2>
            <Suspense fallback={<div className="min-h-[520px] rounded-[14px] bg-cine-bg2" aria-hidden="true" />}>
              <QuoteWizard
                successTitle={page?.successTitle ?? "Demande envoyée."}
                successText={page?.successText ?? "Notre équipe revient vers vous rapidement."}
              />
            </Suspense>
          </div>
        </div>
      </section>

      <FaqSection items={faq} />
    </>
  )
}
