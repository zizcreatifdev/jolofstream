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
    <footer className="bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo variant="blancJaune" width={140} height={42} href="/" />
            <p className="mt-4 text-sm leading-relaxed">
              Captation et diffusion en direct d&apos;evenements. Dakar,
              Senegal.
            </p>
            <ul className="mt-5 flex items-center gap-3">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <li key={social.label}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    href="/services"
                    className="transition-colors hover:text-white"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Liens rapides
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-white"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${tel}`}
                  className="transition-colors hover:text-white"
                >
                  {phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-800 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-zinc-500">
            &copy; 2026 Jolof Stream. Tous droits reserves.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/mentions-legales"
              className="text-zinc-500 transition-colors hover:text-white"
            >
              Mentions legales
            </Link>
            <Link
              href="/cgv"
              className="text-zinc-500 transition-colors hover:text-white"
            >
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
