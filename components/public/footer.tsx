import Link from "next/link"

import { Logo } from "@/components/public/logo"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/public/social-icons"

const services = [
  "Captation & Streaming Live",
  "CEO Content Package",
  "Creator Weekend",
  "Gestion reseaux",
]

const quickLinks = [
  { label: "Accueil", href: "/" },
  { label: "Formations", href: "/formations" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "A propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
]

async function getFooterParams() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(
      `${baseUrl}/api/parametres?keys=company_email,company_phone,social_facebook,social_instagram,social_youtube,social_linkedin,social_tiktok`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    return (await res.json()) as Record<string, string>
  } catch {
    return null
  }
}

export async function Footer() {
  const p = (await getFooterParams()) ?? {}
  const email = p.company_email || "jolofstream@gmail.com"
  const phone = p.company_phone || "+221 70 241 48 48"
  const tel = (phone || "").replace(/[^+0-9]/g, "")
  const socials = [
    { label: "Facebook", icon: FacebookIcon, href: p.social_facebook || "#" },
    { label: "Instagram", icon: InstagramIcon, href: p.social_instagram || "#" },
    { label: "YouTube", icon: YoutubeIcon, href: p.social_youtube || "#" },
    { label: "LinkedIn", icon: LinkedinIcon, href: p.social_linkedin || "#" },
  ]

  return (
    <footer className="bg-ink text-ink-4">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo variant="blancJaune" width={150} height={45} href="/" />
            <p className="mt-5 max-w-xs text-sm font-light leading-relaxed text-ink-4">
              Captation et diffusion en direct d&apos;evenements. Dakar,
              Senegal.
            </p>
            <ul className="mt-6 flex items-center gap-2.5">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <li key={social.label}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] text-ink-4 transition-all duration-150 hover:border-white/15 hover:bg-white/[0.12] hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              Services
            </h2>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    href="/services"
                    className="text-sm font-light text-ink-4 transition-colors hover:text-white"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              Liens rapides
            </h2>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-light text-ink-4 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              Contact
            </h2>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="text-sm font-light text-ink-4 transition-colors hover:text-white"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${tel}`}
                  className="text-sm font-light text-ink-4 transition-colors hover:text-white"
                >
                  {phone}
                </a>
              </li>
              <li className="pt-1 text-xs font-light text-ink-4">
                Dakar, Senegal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs font-light sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-4">
            &copy; 2026 Jolof Stream. Tous droits reserves.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/mentions-legales"
              className="text-ink-4 transition-colors hover:text-white"
            >
              Mentions legales
            </Link>
            <Link
              href="/cgv"
              className="text-ink-4 transition-colors hover:text-white"
            >
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
