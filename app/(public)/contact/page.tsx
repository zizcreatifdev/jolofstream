import type { Metadata } from "next"
import Link from "next/link"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { PageHero } from "@/components/public/page-hero"
import { ContactQuoteForm } from "@/components/public/contact-quote-form"
import { FaqAccordion, type FaqItem } from "@/components/public/faq-accordion"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/public/social-icons"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Demande de devis, coordonnees, FAQ : prenons contact pour votre prochain evenement.",
}

const socials = [
  { label: "Facebook", icon: FacebookIcon, href: "#" },
  { label: "Instagram", icon: InstagramIcon, href: "#" },
  { label: "YouTube", icon: YoutubeIcon, href: "#" },
  { label: "LinkedIn", icon: LinkedinIcon, href: "#" },
]

const faqItems: FaqItem[] = [
  {
    question: "Quels types d'evenements couvrez-vous ?",
    answer:
      "Nous couvrons tous types d'evenements : conferences, galas, mariages, evenements d'entreprise, formations, concerts. Si vous avez un projet specifique, contactez-nous.",
  },
  {
    question: "Comment se deroule le paiement ?",
    answer:
      "Nous n'acceptons pas de paiement en ligne direct. Apres validation du devis, nous vous envoyons un lien Wave Business ou les coordonnees pour un virement bancaire.",
  },
  {
    question: "Intervenez-vous en dehors de Dakar ?",
    answer:
      "Oui, nous intervenons partout au Senegal et en Afrique de l'Ouest. Des frais de deplacement peuvent s'appliquer selon la distance.",
  },
  {
    question:
      "Quel est le delai pour recevoir les enregistrements apres l'evenement ?",
    answer:
      "Les enregistrements bruts sont disponibles sous 48h. Le montage final est livre sous 5 a 7 jours ouvrables selon le volume.",
  },
  {
    question: "Proposez-vous des forfaits pour les associations et ONG ?",
    answer:
      "Oui, nous proposons des tarifs adaptes pour les associations, ONG et structures educatives. Mentionnez-le dans votre demande de devis.",
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Parlons de votre projet"
        subtitle="Decrivez votre evenement, nous vous repondons sous 24h avec une proposition adaptee."
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Demande de devis
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Tous les champs marques sont requis. Reponse sous 24h.
              </p>
              <div className="mt-6">
                <ContactQuoteForm />
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  Coordonnees
                </h3>
                <ul className="mt-4 space-y-4 text-sm text-zinc-700">
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                    <a
                      href="mailto:jolofstream@gmail.com"
                      className="hover:text-zinc-900"
                    >
                      jolofstream@gmail.com
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                    <a
                      href="tel:+221702414848"
                      className="hover:text-zinc-900"
                    >
                      +221 70 241 48 48
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                    <span>Dakar, Senegal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C8151B]" />
                    <span>Lundi - Samedi, 8h - 20h</span>
                  </li>
                </ul>
                <p className="mt-4 text-xs text-zinc-500">
                  Donnees provisoires. A confirmer dans Parametres avant
                  lancement.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  Reseaux sociaux
                </h3>
                <ul className="mt-4 flex items-center gap-3">
                  {socials.map((social) => {
                    const Icon = social.icon
                    return (
                      <li key={social.label}>
                        <Link
                          href={social.href}
                          aria-label={social.label}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Questions frequentes
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Vous ne trouvez pas votre reponse ? Posez-la dans le formulaire
            ci-dessus.
          </p>
          <div className="mt-8">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>
    </>
  )
}
