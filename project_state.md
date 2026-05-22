# État du projet — Jolof Stream

## Prompt en cours
Prompt 11 — Module Paramètres complet (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 10 terminés
- [x] lib/parametres.ts : toutes les cles + PARAM_DEFAULTS + helpers parseJsonField + types AboutValue/AboutTeamMember/AboutStat/Testimonial
- [x] app/api/parametres/route.ts : GET (?keys=k1,k2 ou tous) + POST (upsert transactionnel + ActivityLog)
- [x] app/api/parametres/[key]/route.ts : GET public d'une cle
- [x] app/api/profil/route.ts : PATCH limite a l'utilisateur connecte (firstName/lastName/avatarUrl/newPassword, bcrypt 12 rounds)
- [x] prisma/seed.ts : seed des PARAM_DEFAULTS (upsert idempotent, update: {} preserve les valeurs existantes)
- [x] components/admin/parametres/parametres-client.tsx : 7 sections en navigation verticale gauche + formulaires droite (Entreprise, Reseaux sociaux, PDF, Contenu site, CGV/Mentions, Notifications, Profil)
- [x] Section Contenu site avec ListEditor reutilisable pour valeurs/equipe/stats/temoignages (ajout/suppression dynamique)
- [x] app/admin/(dashboard)/parametres/page.tsx : Server Component qui charge initial params + profil utilisateur
- [x] components/admin/documents/pdf-template.tsx : props companyName/Address/Email/Phone/Ninea/Rc/pdfFooterText avec defauts
- [x] lib/use-pdf-company.ts : hook client qui charge les parametres entreprise via fetch /api/parametres
- [x] document-form.tsx et document-detail.tsx : injectent company via usePdfCompany dans pdfProps
- [x] components/public/footer.tsx : Server Component async, fetch email/telephone/socials depuis /api/parametres (revalidate 60)
- [x] app/(public)/a-propos/page.tsx : fetch about_history/mission/values/team/stats depuis /api/parametres + fallback
- [x] app/(public)/cgv/page.tsx : fetch cgv_content + fallback
- [x] app/(public)/mentions-legales/page.tsx : fetch mentions_legales_content + fallback
- [x] components/public/home-sections.tsx TestimonialsSection : useEffect fetch testimonials JSON + fallback, rating dynamique (Math.min 5)
- [x] components/public/about-stats.tsx : prop items optionnelle pour customisation
- [x] decisions.md : D-032 (Settings table cle-valeur + JSON), D-033 (profil propre uniquement), D-034 (PdfTemplate props + usePdfCompany)
- [x] npm run build OK — 54 routes (3 nouvelles API : /api/parametres, /api/parametres/[key], /api/profil)

## Routes API actives (nouvelles ce prompt)
- `GET|POST /api/parametres` (POST auth)
- `GET /api/parametres/[key]` (public)
- `PATCH /api/profil` (auth, modifie soi-meme uniquement)

## Pages publiques connectees a la DB Parametres
- Footer : email + tel + 4 socials
- /a-propos : history + mission + values + team + stats
- /cgv : cgv_content
- /mentions-legales : mentions_legales_content
- / (accueil) : testimonials (via TestimonialsSection useEffect)
- PDF devis/factures : companyName/Address/Email/Phone/Ninea/Rc/pdfFooterText injectes dans le template

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` et `npx prisma db seed` executes en local.

## Actions à faire par l'utilisateur sur sa machine locale
```bash
git pull origin main && npm install
npx prisma db push   # pas de migration schema (Setting existait)
npx prisma db seed   # seed admins + 4 offres + tous les PARAM_DEFAULTS
npm run dev
# Tester /admin/parametres :
#  - 7 sections en navigation verticale
#  - Entreprise : remplir NINEA, RC, Wave, banque -> Sauvegarder
#  - Reseaux sociaux : URLs -> verifier footer du site public
#  - Contenu site -> Valeurs/Equipe/Stats : ajouter/supprimer -> verifier /a-propos
#  - Temoignages -> verifier accueil
#  - CGV : modifier texte -> verifier /cgv
#  - Mentions legales : modifier -> verifier /mentions-legales
#  - Mon profil : changer prenom/nom + mot de passe (min 8) -> reconnexion
# Tester PDFs :
#  - Generer un devis -> en-tete + footer reflètent les parametres entreprise (NINEA, RC, etc.)
```

## Ce qui reste (Phase 1)
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe + notifications liste d'attente
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Upload de fichiers (signature PDF, avatars, photos equipe) : seules URLs en input texte pour Phase 1. Upload Supabase Storage natif Phase 2 (CDC §6.7 le mentionne pour Portfolio mais ici on n'a pas d'upload).
- Editeur riche pour CGV : textarea simple monospaced. Editeur HTML/Markdown reporte Phase 2.

## Problèmes signalés / décisions prises (Prompt 11)
- D-032 : Setting table cle-valeur unique. JSON.stringify pour les listes structurees (valeurs/equipe/stats/temoignages). Avantage : pas de nouvelles tables. Inconvenient : pas de validation au niveau DB sur la structure (validee cote serveur dans les pages publiques avec parseJsonField + fallback).
- D-033 : route /api/profil utilise session.user.id pour cibler UNIQUEMENT le user connecte. Aucun parametre id externe accepte -> impossible de modifier le profil d'un autre admin meme malicieusement.
- D-034 : usePdfCompany hook reutilise dans document-form et document-detail. Performance : 1 fetch par mount par composant. Cache no-store pour avoir les changements admin immediats. Defauts dans le PdfTemplate evitent un rendu vide si le fetch est en cours ou echoue.
- AboutStatsGrid : passe d'un composant a items hardcodes a items en prop optionnel (fallback hardcode si absent). Retrocompatible avec l'usage existant sur la page Accueil (qui ne passe pas d'items).
- Lint correction : `let initialParams` -> `const` (la mutation interne d'un object const est valide).
- Footer devient async : Next.js 14 App Router supporte les async Server Components rendus depuis un layout sans modification supplementaire.

## Prochaine étape
Prompt 12 — Emails automatiques Resend + reset password, après Go.
