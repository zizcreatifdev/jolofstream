# Architecture : Jolof Stream

## Stack technique
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Shadcn/UI (dashboard) + Framer Motion (animations site public uniquement)
- React Hook Form + Recharts + React-PDF
- Prisma ORM + Supabase (PostgreSQL + Storage)
- NextAuth.js (session JWT 7 jours)
- Resend (emails + mail marketing)
- Sharp (optimisation images)
- Vercel (déploiement)

## Structure des dossiers
/app
  /(public)         → site public (routes publiques)
  /admin            → dashboard admin (routes protégées)
  /admin/login      → page de connexion
  /api              → API Routes Next.js
/components
  /ui               → composants Shadcn/UI
  /public           → composants site public
  /admin            → composants dashboard
/lib                → utilitaires, helpers, config
/prisma             → schema.prisma + migrations
/emails             → templates Resend (React Email)

## Conventions
- Nommage fichiers : kebab-case
- Nommage composants : PascalCase
- Nommage fonctions/variables : camelCase
- Aucun emoji dans le code
- Framer Motion uniquement pour les animations
- Zéro tiret long dans le code
- Routes API : /api/[module]/[action]
- Chaque action UI a une route API : aucun bouton sans action

## URL structure
- jolofstream.com/ → site public
- jolofstream.com/admin → dashboard (auth requise)
- jolofstream.com/admin/login → page connexion
- Redirection www → sans www automatique

## Couleurs Jolof Stream
- Rouge : #C8151B
- Jaune : #F5B800

## Site public V2 "Cinéma plein écran" (refonte en 6 prompts terminée, D-163 à D-220)
Reference : docs/maquettes/site-v2-cinema.html (maquette, non copiee telle quelle).

Habillage commun (app/(public)/layout.tsx, revalidate 60) :
- components/public/site/site-chrome.tsx : client, barre de lecture, en-tete, menu, transition "coupe de montage" (interception des clics sur liens internes puis router.push)
- components/public/site/site-header.tsx : logo, HUD REC + timecode + scene, navigation, devis, bouton Menu
- components/public/site/menu-overlay.tsx : menu plein ecran (dialog accessible)
- components/public/site/site-footer.tsx : pied de page serveur
- lib/site-nav.ts : scenes, navigation, chapitres de /services
- lib/site-settings.ts : coordonnees et reseaux (Setting, cache 60 s)
- lib/use-dialog-a11y.ts : piege du focus, blocage du defilement, detection de fenetre ouverte, mouvement reduit

Hero de l'accueil :
- components/public/hero/hero-carousel.tsx (+ hero-stage.tsx repli anime, hero-player.tsx lecteur avec son)
- lib/hero-slides.ts : schema Zod partage, regles, helpers YouTube et bucket
- Modele Prisma HeroSlide + parametre Setting hero_slide_duration
- API : /api/hero-slides, /api/hero-slides/[id], /api/hero-slides/reorder, /api/storage/signed-upload
- Admin : components/admin/parametres/hero-slides-manager.tsx, components/admin/ui/media-upload.tsx
- Storage : bucket public "hero" (videos 15 Mo, couvertures 1 Mo), televersement direct navigateur par URL signee (lib/supabase-browser.ts, cle anonyme)

Design : tokens Tailwind cine-* (fonds #050303 / #0E0908 / #161010, creme #F4F0EA / #EAE4DB, encre #1A1110, rouge #C8151B / #8F0E12, jaune #F5B800). Polices : Instrument Serif (titres), Bricolage Grotesque (texte) et JetBrains Mono (étiquettes et timecode), toutes via next/font dans app/layout.tsx (variables --font-instrument, --font-bricolage, --font-mono ; plus d'@import Google Fonts, D-219). Interdits : bandes colorees sur le bord des cartes, halos ou formes floues, degrades sur les barres de progression, pointilles, emojis, tiret long.

## Migrations de base
Le schema est synchronise a la main : chaque evolution fournit un SQL a executer dans l'editeur SQL Supabase. Depuis D-168, le SQL est aussi range dans prisma/migrations/<horodatage>_<nom>/migration.sql (idempotent), sans execution automatique au deploiement. Apres une migration : redeploiement Vercel sans cache (client Prisma regenere).

### Accueil et Services V2 (prompt 2, D-172 a D-180)
- Accueil : app/(public)/page.tsx, sections dans components/public/home/ (manifeste, savoir-faire, realisations, offres + carte Formations isolee, temoignages, appel final)
- Services : app/(public)/services/page.tsx, components/public/services/ (navigation collante, ?s=)
- Briques communes : components/public/cine/primitives.tsx (Kicker, CineHeading, Emphasis, CineButton)
- Donnees : lib/home-data.ts (lectures serveur), lib/site-content.ts (schemas Zod des blocs JSON), lib/testimonials.ts, lib/offers.ts (4 types d'offres), lib/site-links.ts (liens), lib/storage-buckets.ts et lib/storage-cleanup.ts (buckets hero et site)
- API : /api/site-content/[key], /api/testimonials, /api/testimonials/[id], /api/testimonials/reorder
- Admin : Parametres > Contenu du site en onglets (components/admin/parametres/home-content-editor.tsx, services-content-editor.tsx, testimonials-manager.tsx, content-fields.tsx), liste reordonnable components/admin/ui/sortable-list.tsx
- Animations sans librairie : CSS (animation-timeline avec repli IntersectionObserver ou calcul au defilement), coupees en mouvement reduit

### Formations en programmes et cohortes (prompt 3, D-181 a D-188)
- Modeles : TrainingProgram (fiche, plaquette) -> TrainingSession (cohorte, programId obligatoire, label, scheduleText, title tenu a jour) -> TrainingRegistration (holdExpiresAt) ; Testimonial.programId facultatif
- Regles : lib/training-programs.ts (schemas Zod de la fiche et de la plaquette, slugify, bornes du delai), lib/formations.ts (cohortDisplayName, COHORT_NAME_SELECT, holdDeadline, isHoldOverdue, formatDeadline), lib/training-delay.ts (parametre training_payment_delay_hours), lib/training-holds.ts (reservations hors delai), lib/training-program-stats.ts (chiffres de la liste), lib/formation-emails.ts (donnees communes des emails)
- API : /api/formations/programmes (+ /[id], /reorder, /[id]/plaquette), /api/formations/sessions (programId), /api/formations/inscriptions/[id] (confirmer, annuler, mettre_en_attente, relancer, prolonger, liberer)
- Public : /formations (noms de cohorte), /formations/[slug]/plaquette (redirection 302 vers le PDF, no-store)
- Admin : /admin/formations (programs-list.tsx, ?filtre=hors-delai), /admin/formations/programmes/[id] (program-editor.tsx), /admin/formations/[id] (session-detail.tsx), Parametres > Formations
- Emails : emails/_formation.tsx (bloc commun), confirmation-inscription-formation, liste-attente-promue, relance-paiement-formation ; lib/email.ts fait le rendu HTML avant Resend
- Storage : bucket public "formations" (PDF 10 Mo), regle "brochure" dans lib/storage-buckets.ts

### Formations publiques et reservation (prompt 4, D-189 a D-195)
- Regles : lib/cohort-public.ts (statut, places, dates, delai affiche, sans base), lib/formations-public.ts (getPublicPrograms, upcomingCohorts, getProgramTestimonials, cohortAvailability), lib/phone.ts (normalisation), lib/hero-badge.ts (jeton {prochaine-cohorte}), lib/emphasis.ts (syntaxe *italique*, hors Zod)
- Page /formations : app/(public)/formations/page.tsx, components/public/formations/program-block.tsx et cohort-row.tsx, contenu formations_page (Parametres > Contenu du site > Formations, formations-content-editor.tsx)
- Tunnel /formations/reserver : app/(public)/formations/reserver/page.tsx (serveur) et components/public/formations/reservation-wizard.tsx (client)
- API : POST /api/formations/inscription (verrou FOR UPDATE, doublon 409, champ piege, telephone normalise)
- Accueil : components/public/home/formations-offer-card.tsx (cohortes), badge du hero remplace dans app/(public)/page.tsx

### Contact, demandes de devis, portfolio, a propos, pages legales (prompt 5, D-196 a D-202)
- Modele QuoteRequest (Client 1-n, Quote 1-n) ; regles lib/quote-requests.ts (besoins, plateformes, cameras, statuts, schema Zod, preselection ?besoin=/?service=), lecture admin lib/quote-requests-server.ts, limitation lib/rate-limit.ts
- Public : /contact (components/public/contact/quote-wizard.tsx, faq-section.tsx), /portfolio (components/public/portfolio/portfolio-board.tsx), /a-propos (lib/about.ts), /mentions-legales et /cgv (components/legal/legal-page.tsx, legal-text.tsx, lib/legal-data.ts, lib/legal-text.ts, lib/legal-templates.ts, lib/legal-fields.ts)
- API : POST /api/contact/devis ; admin /api/demandes, /api/demandes/[id], /api/demandes/count ; POST /api/devis accepte quoteRequestId
- Admin : /admin/demandes (components/admin/demandes/demandes-board.tsx), pastille components/admin/use-new-requests.tsx, onglet Demandes de la fiche client, carte du tableau de bord ; Parametres > Contenu du site (onglets Portfolio et Contact, en-tete A propos : pages-content-editor.tsx), Informations de l'agence, Documents legaux (modele V2 et apercu)
- Contenus site-content ajoutes : contact_page, portfolio_page, about_page, faq_items
- Emails : nouveau-lead.tsx (notification admin), accuse-reception-devis.tsx (demandeur)

### Audit final et état de clôture de la V2 (prompt 6, D-203 à D-220)
- Pages publiques : /, /services, /formations, /formations/reserver (noindex), /formations/[slug] (redirections 308 ou 404, D-208), /formations/[slug]/plaquette, /portfolio, /a-propos, /contact, /mentions-legales, /cgv, /offline ; sitemap des 8 pages indexables, robots, opengraph-image, manifest.
- SEO : lib/seo.ts (pageMetadata, CANONICAL_ORIGIN https://jolofstream.com) pour titre, description, canonical, Open Graph et Twitter ; JSON-LD Organization (accueil), Service (services), Course (formations), LocalBusiness et FAQPage (contact), AboutPage (à propos) ; layouts admin en noindex.
- Sécurité : en-têtes dans next.config.js (SAMEORIGIN, nosniff, Referrer-Policy, Permissions-Policy), middleware sur /admin ; chaque route API admin vérifie la session ; routes publiques d'écriture (contact/devis, formations/inscription) avec champ piège, limite par IP (lib/rate-limit.ts) et Zod ; liens de campagne par jeton chiffré (lib/marketing-token.ts) et suivi de clic sans redirection ouverte.
- Storage : buckets hero, site, formations (V2) et avatars, signatures, equipe, portfolio (V1), règles dans lib/storage-buckets.ts ; écriture uniquement par URL signée (/api/storage/signed-upload, composants media-upload.tsx et image-upload.tsx, plaquette dans program-editor.tsx) ; suppression par /api/storage/delete et lib/storage-cleanup.ts.
- Accessibilité : lib/use-dialog-a11y.ts (piège de focus avec sentinelles, blocage du défilement) pour le menu, le lecteur du hero et la visionneuse du portfolio ; cibles de 44 px ; contrastes AA y compris au survol et sur image ou vidéo (voiles de lisibilité, D-216).
- Aperçu du hero : lib/hero-badge.ts (jeton, texte pur) et lib/hero-badge-server.ts (prochaine cohorte) partagés par l'accueil et GET /api/hero-slides.
- Performance mesurée (Lighthouse mobile, build local) : accueil 88 à 91, /formations 93 à 94, /contact 93 à 95 en performance selon les passages ; accessibilité et SEO à 100, bonnes pratiques 96 à 100 (96 quand les miniatures YouTube sont injoignables depuis l'environnement de test) ; CLS 0 ; First Load JS de l'accueil 189 kB.
- Emails : 11 modèles React Email et 4 modèles de campagne, rendus par lib/email.ts (render puis Resend), liens absolus vers https://jolofstream.com.
- Recette de production : docs/recette-v2.md.
