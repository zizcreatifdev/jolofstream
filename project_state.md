# État du projet — Jolof Stream

## Prompt en cours
Prompt 05 — Pages site public détaillées (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 04 terminés
- [x] `lib/schemas.ts` : schémas Zod partagés (trainingRegistration, quoteRequest)
- [x] `app/api/formations/inscription/route.ts` : POST avec validation Zod, écriture training_registrations + gestion liste d'attente, fallback dbSkipped si DB inaccessible
- [x] `app/api/contact/devis/route.ts` : POST avec validation Zod, création lead Client, fallback dbSkipped
- [x] `components/public/page-hero.tsx` : hero réutilisable (fond zinc-950, radial-gradient rouge/jaune, fade-in)
- [x] `components/public/formations-inscription-form.tsx` : formulaire RHF + Zod, success state, gestion liste d'attente
- [x] `components/public/contact-quote-form.tsx` : formulaire RHF + Zod 8 champs, success state
- [x] `components/public/faq-accordion.tsx` : accordion léger Framer Motion, sans dépendance Shadcn
- [x] `components/public/portfolio-grid.tsx` : filtres client (Tout/Streaming/CEO/Creator/Formations), grille décalée (cartes tall/normal), hover play/image overlay, liens YouTube cliquables externes
- [x] `components/public/about-stats.tsx` : 4 stats animées whileInView (réutilisé sur /a-propos)
- [x] `app/(public)/services/page.tsx` : Hero + 3 services (Captation, CEO Content, Creator Weekend) avec 2 forfaits par service + processus 4 étapes + add-on Gestion réseaux encadré jaune + CTA final rouge
- [x] `app/(public)/formations/page.tsx` : Hero + 2 sessions placeholder avec jauge et badge (Bientôt complet < 20%), encadré Wave jaune, formulaire d'inscription ancré #inscription
- [x] `app/(public)/portfolio/page.tsx` : Hero + filtres + grille 6 cartes placeholder (3 hauteurs alternées)
- [x] `app/(public)/a-propos/page.tsx` : Hero + Notre histoire + Notre mission + 4 Valeurs + 2 membres équipe (placeholder avatars initiales) + 4 stats
- [x] `app/(public)/contact/page.tsx` : Hero + layout 2 colonnes (formulaire devis + sidebar coordonnées + réseaux sociaux) + FAQ 5 questions accordéon
- [x] npm run build OK — 28 routes (10 publiques + 12 admin + 4 API + 2 spéciales)

## Routes API actives
- `POST /api/formations/inscription` — validation Zod, écriture `training_registrations`, gestion liste d'attente automatique selon `maxSeats`
- `POST /api/contact/devis` — validation Zod, écriture `Client` (type entreprise/particulier, status prospect, acquisition site_web, tag lead-site-web, notes formatées)
- `POST /api/auth/reset-password` — placeholder 501 (Prompt 11 ou 12)
- `GET|POST /api/auth/[...nextauth]` — NextAuth

## Bloqueurs réseau (inchangés)
- Supabase database et API : host_not_allowed
- Google Fonts : contourné via system fonts (D-015)
- Registre Shadcn : contourné via composants manuels
- Lucide icons de marques : contourné via SVG inline (D-016)

Conséquence pour Prompt 05 : les POST sur `/api/formations/inscription` et `/api/contact/devis` retournent `{ success: true, dbSkipped: true }` dans cet environnement, mais réussiront en local une fois la DB migrée. Pas d'envoi d'email Resend dans ce prompt (Prompt 12).

## Actions à faire par l'utilisateur sur sa machine locale
Toujours en attente : `npx prisma db push && npx prisma db seed` puis test des formulaires.
```bash
git pull origin main && npm install && npm run dev
# Tester /services -> 3 services, forfaits, processus, add-on jaune, CTA rouge
# Tester /formations -> sessions + jauge, encadre Wave, formulaire d'inscription (POST /api/formations/inscription)
# Tester /portfolio -> filtres fonctionnels
# Tester /a-propos -> sections en cascade
# Tester /contact -> formulaire devis (POST /api/contact/devis) + FAQ accordeon
# Verifier creation de lead Client en DB apres soumission /contact
```

## Ce qui reste (Phase 1)
- [ ] Prompt 06 — Module CRM Clients (dashboard)
- [ ] Prompt 07 — Module Projets
- [ ] Prompt 08 — Module Devis & Factures (avec React-PDF)
- [ ] Prompt 09 — Module Formations (dashboard + flux Wave)
- [ ] Prompt 10 — Module Catalogue Offres + Portfolio dashboard
- [ ] Prompt 11 — Module Paramètres (toutes sections)
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Réseaux sociaux footer/contact : tous en `#` jusqu'au Prompt 11 (Paramètres)
- Numéro Wave Business / lien dynamique : à fournir Prompt 11 ; l'API formations enregistre déjà l'inscription mais l'email avec lien Wave sera branché Prompt 12

## Problèmes signalés / décisions prises (Prompt 05)
- Aucune nouvelle décision majeure. Toutes les routes API ont un pattern try/catch avec fallback `dbSkipped: true` pour ne jamais crasher si Supabase est injoignable (cohérent avec le contexte conteneur).
- FAQ accordéon implémenté à la main (pas d'usage du composant `@radix-ui/react-accordion` pour rester léger et ne pas ajouter une dépendance pour 5 questions).
- Validation Zod côté client ET serveur (mêmes schémas dans `lib/schemas.ts`) — pattern unique.

## Prochaine étape
Prompt 06 — Module CRM Clients dashboard, après Go.
