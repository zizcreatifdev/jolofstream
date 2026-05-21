# État du projet — Jolof Stream

## Prompt en cours
Prompt 03 — Layout dashboard (TERMINÉ côté code, DB toujours non migrée à cause du blocage réseau)

## Ce qui est fait
- [x] Prompt 00 — Initialisation fichiers mémoire
- [x] Prompt 01 — Initialisation projet Next.js
- [x] Prompt 02 — Auth complète + 22 composants Shadcn manuels + page login
- [x] Restructure en route groups : app/admin/(auth)/login + app/admin/(dashboard)/*
- [x] app/admin/(auth)/layout.tsx — passthrough
- [x] app/admin/(dashboard)/layout.tsx — getServerSession + Providers + Sidebar + Topbar + main
- [x] components/admin/providers.tsx — SessionProvider client wrapper
- [x] components/admin/sidebar.tsx — 240px fixe, fond zinc-900, 3 zones (logo, nav, profil)
  - 12 liens navigation groupés (Principal, Finance, Services, Documents, Communication, Equipe)
  - Lien actif avec barre rouge 3px à gauche
  - Bouton Deconnexion avec signOut callback /admin/login
  - Profil utilisateur via useSession (avatar / initiales, nom, email)
- [x] components/admin/topbar.tsx — h-16 sticky, titre + fil d'Ariane + bouton contextuel + cloche
  - Mapping pathname → titre + actionLabel (CDC § 5.3)
  - Bouton rouge avec PlusCircle Lucide, émet CustomEvent admin:primary-action (D-014)
  - Cloche Bell avec badge rouge si notifs > 0 (hardcodé à 0)
- [x] components/admin/module-placeholder.tsx — composant réutilisable
- [x] app/admin/(dashboard)/page.tsx — Vue d'ensemble avec nom utilisateur (Prompt 13 pour KPIs)
- [x] 11 pages placeholder créées : projets, clients, devis-factures, comptabilite, formations, catalogue, portfolio, contrats, mail-marketing, journal, parametres
- [x] decisions.md : D-013 (route groups) et D-014 (CustomEvent) ajoutés
- [x] npm run build OK — 19 routes, middleware 49.4 kB

## Bloqueurs réseau (inchangés)
- Supabase database (ports 5432 et 6543) : host_not_allowed
- Supabase API HTTPS : 403 host_not_allowed
- Registre Shadcn : 403 host_not_allowed (contourné)

## Actions à faire par l'utilisateur sur sa machine locale (réseau ouvert)
Inchangées depuis Prompt 02 — pas encore exécutées :
```bash
git pull origin main
npm install
# Verifier .env (cf. Prompt 02)
npx prisma db push
npx prisma db seed
npm run dev
# Tester /admin -> redirect /admin/login -> login -> /admin
# Cliquer sur chaque entree de la sidebar -> verifier titre + bouton contextuel + active state
# Cliquer Deconnexion -> retour /admin/login
```

## Ce qui reste (Phase 1)
- [ ] Prompt 04 — Site public : layout, navbar, footer, page Accueil
- [ ] Prompt 05 — Site public : pages Services, Portfolio, À propos, Contact, Formations
- [ ] Prompt 06 — Module CRM Clients
- [ ] Prompt 07 — Module Projets
- [ ] Prompt 08 — Module Devis & Factures (avec React-PDF)
- [ ] Prompt 09 — Module Formations (dashboard + flux Wave)
- [ ] Prompt 10 — Module Catalogue Offres + Portfolio dashboard
- [ ] Prompt 11 — Module Paramètres (toutes sections)
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend)
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- NINEA, numéro RC, adresse, Wave, logo, photos : placeholders en dev
- Flux "Mot de passe oublié" complet à implémenter (Prompt 03 le mentionnait mais sortait du scope effectif — déplacé en Prompt 11 ou 12 lorsque Resend sera branché)

## Problèmes signalés / décisions prises
- D-013 : restructure en route groups Next.js pour isoler /admin/login du layout dashboard. La consigne initiale du Prompt 03 (créer app/admin/login/layout.tsx) ne suffisait pas techniquement : les layouts s'imbriquent en Next.js, donc le layout dashboard aurait quand même enveloppé /admin/login et bouclé sur le redirect getServerSession. Solution canonique route groups appliquée. URLs identiques.
- D-014 : le bouton d'action contextuel de la topbar émet un CustomEvent `admin:primary-action` au lieu d'un onClick vide. Respecte Règle 1 (aucun bouton placeholder). Chaque page de module branchera son listener aux Prompts 06+.
- Lint Next.js : apostrophe non-échappée dans `Vue d'ensemble` → corrigé via `&apos;`. Pas d'autre warning.

## Prochaine étape
Prompt 04 — Site public layout + page Accueil, après Go.
