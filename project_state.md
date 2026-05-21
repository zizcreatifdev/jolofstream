# État du projet — Jolof Stream

## Prompt en cours
Prompt 04 — Site public layout + page Accueil (TERMINÉ côté code, DB toujours non migrée — sans impact ici)

## Ce qui est fait
- [x] Prompts 00 à 03 terminés
- [x] Restructure du site public en route group `app/(public)/`
- [x] `app/(public)/layout.tsx` : Navbar + main + Footer
- [x] `components/public/navbar.tsx` : sticky h-72, logo, 6 liens, CTA rouge, drawer mobile Framer Motion, transition transparent/blanc selon scroll (sur home uniquement)
- [x] `components/public/footer.tsx` : 4 colonnes (logo + socials, Services, Liens rapides, Contact), bas de footer copyright + Mentions/CGV, responsive
- [x] `components/public/social-icons.tsx` : 4 SVG inline (Facebook, Instagram, YouTube, LinkedIn) — D-016
- [x] `components/public/home-sections.tsx` : 8 sections de la page Accueil, animations Framer Motion (stagger hero, whileInView stats et CTA final)
- [x] `app/(public)/page.tsx` : compose les 8 sections dans l'ordre CDC §4.3
- [x] 7 pages placeholder publiques : services, formations, portfolio, a-propos, contact, mentions-legales, cgv (composant `PagePlaceholder` réutilisable, chacune avec metadata, intro spécifique, prompt de complétion)
- [x] `app/layout.tsx` mis à jour : lang fr, metadata title template + description, font-sans system (D-015)
- [x] decisions.md : D-015 (system fonts), D-016 (SVG inline socials), D-017 (Framer Motion ease as const)
- [x] npm run build OK — 26 routes (8 publiques + 12 admin + 2 API)

## Sections de la page Accueil (CDC §4.3)
1. Hero — fond sombre, badge pulse vert, titre 7xl + italic rouge, double CTA, staggerChildren Framer Motion
2. Bande services rouge — 4 items en ligne (scroll horizontal sur mobile)
3. Qui sommes-nous — 2 paragraphes + 4 stats 2x2 animees au scroll
4. Services phares — 3 cartes (Captation, CEO Content, Creator Weekend) avec icones Lucide
5. Apercu portfolio — 5 cartes placeholder avec note "remplacees Prompt 10"
6. Formations a venir — 2 cartes placeholder avec jauge, note "remplacees Prompt 09"
7. Temoignages — 3 cartes placeholder avec etoiles, note "Parametres Prompt 11"
8. CTA final — fond rouge, fade-in scroll

## Bloqueurs réseau (inchangés)
- Supabase database et API : host_not_allowed
- Google Fonts : host_not_allowed (contourné via system font stack, D-015)
- Registre Shadcn : host_not_allowed (contourné via composants manuels)
- Lucide icons de marques : retirées de v1.16 (contourné via SVG inline, D-016)

## Actions à faire par l'utilisateur sur sa machine locale
Inchangées : migration DB + seed à exécuter (Prompt 02 + 03 ci-dessus).
Nouveau test au Prompt 04 :
```bash
npm run dev
# Naviguer vers http://localhost:3000/
# Verifier hero, animations, scroll navbar transparent->blanc, drawer mobile
# Cliquer sur chaque lien menu/footer -> verifier les pages placeholder
# Verifier le CTA "Demander un devis" pointe partout vers /contact
```

## Ce qui reste (Phase 1)
- [ ] Prompt 05 — Site public : pages Services, Formations, Portfolio, À propos, Contact (et placeholders Mentions/CGV à compléter Prompt 11)
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
- NINEA, RC, adresse, Wave, logo, photos, réseaux sociaux : placeholders en dev
- Réseaux sociaux footer : tous en `#` — les liens réels seront saisis dans Paramètres au Prompt 11

## Problèmes signalés / décisions prises
- D-015 (fonts) : impossible d'utiliser next/font/google en build local. Le déploiement Vercel ouvrira l'accès Google Fonts → réversion possible plus tard en ajoutant un seul import.
- D-016 (icônes sociaux) : lucide-react 1.16 a retiré toutes les icônes de marques. SVG inline 24x24 minimaux écrits dans components/public/social-icons.tsx.
- D-017 (Framer Motion typing) : tous les `ease: "easeOut"` annotés `as const`. Appliqué aussi rétroactivement à la page de login (Prompt 02).
- Apostrophes JSX : utilisation systématique de `&apos;` dans le JSX littéral, apostrophes droites dans les data strings TS.

## Prochaine étape
Prompt 05 — Pages site public détaillées, après Go.
