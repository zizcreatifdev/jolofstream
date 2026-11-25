import Image from "next/image"
import Link from "next/link"

import { SERVICE_CHAPTERS } from "@/lib/site-nav"
import type { SiteContact, SiteSocial } from "@/lib/site-settings"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/public/social-icons"

const LOGO_RATIO = 11236 / 4793

const SOCIAL_ICONS: Record<SiteSocial["key"], typeof FacebookIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  tiktok: TiktokIcon,
}

const NAVIGATION = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/formations", label: "Formations" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/galerie", label: "Galerie" },
  { href: "/a-propos", label: "À propos" },
]

const linkClass =
  "inline-flex min-h-[44px] items-center text-[15px] text-cine-cream/75 transition-colors hover:text-white"

// Pied de page global : coordonnees et reseaux issus des Parametres
export function SiteFooter({ contact }: { contact: SiteContact }) {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-cine-cream/[0.08] bg-cine-bg pb-9 pt-[90px] text-cine-cream">
      <div className="mx-auto max-w-[1440px] px-[clamp(18px,4.5vw,72px)]">
        <p
          aria-hidden="true"
          className="mb-[70px] overflow-hidden whitespace-nowrap font-display text-[clamp(80px,14vw,230px)] leading-[0.85] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(244,240,234,0.18)]"
        >
          Jolof Stream
        </p>

        <div className="mb-[60px] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-9">
          <div>
            <Link
              href="/"
              aria-label={`${contact.companyName}, accueil`}
              className="inline-flex min-h-[44px] items-center rounded-md"
            >
              <Image
                src="/logos/Logo_JolofStream_blancJaune.png"
                alt=""
                width={Math.round(40 * LOGO_RATIO)}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-[260px] text-[14px] leading-[1.7] text-cine-cream/65">
              Capturez l’instant, diffusez l’émotion. Captation et streaming en
              direct depuis {contact.address || "Dakar"}.
            </p>
            {contact.socials.length > 0 && (
              <ul className="mt-[18px] flex gap-2" aria-label="Réseaux sociaux">
                {contact.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.key]
                  return (
                    <li key={social.key}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} (nouvel onglet)`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-cine-cream/[0.06] text-cine-cream/80 transition-colors hover:bg-cine-red hover:text-white"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <FooterColumn title="Navigation">
            {NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Offres">
            {SERVICE_CHAPTERS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Contact">
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phoneHref}`} className={linkClass}>
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </li>
            )}
            <li>
              <Link href="/contact" className={linkClass}>
                Demander un devis
              </Link>
            </li>
            {contact.address && (
              <li className="text-[15px] text-cine-cream/65">{contact.address}</li>
            )}
          </FooterColumn>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px] text-cine-cream/60">
          <span>
            © {year} {contact.companyName}. Tous droits réservés.
          </span>
          <span className="flex items-center gap-2">
            <Link href="/mentions-legales" className="inline-flex min-h-[44px] items-center hover:text-white">
              Mentions légales
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/cgv" className="inline-flex min-h-[44px] items-center hover:text-white">
              CGV
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-cine-cream/55">
        {title}
      </h2>
      <ul className="flex flex-col gap-[11px] sm:gap-0">{children}</ul>
    </div>
  )
}
