# État du projet — Jolof Stream

## Prompt en cours
Prompt 02 — Composants Shadcn manuels + Authentification complète (TERMINÉ côté code, DB non migrée à cause du blocage réseau)

## Ce qui est fait
- [x] Prompt 00 — Initialisation fichiers mémoire
- [x] Prompt 01 — Initialisation projet Next.js
- [x] 22 composants Shadcn/UI écrits manuellement (registry inaccessible)
- [x] lib/utils.ts avec cn() helper
- [x] bcryptjs + @types/bcryptjs + ts-node installés
- [x] app/api/auth/[...nextauth]/route.ts créé
- [x] lib/auth.ts complet (CredentialsProvider, bcrypt.compare, callbacks JWT + session)
- [x] types/next-auth.d.ts créé (Session.user.id et JWT.id typés)
- [x] middleware.ts à la racine (matcher /admin/((?!login).*))
- [x] prisma/seed.ts créé (2 comptes admin admin1@/admin2@jolofstream.com, mot de passe JolofAdmin2026!)
- [x] package.json prisma.seed script configuré
- [x] .env créé (DATABASE_URL + DIRECT_URL pour Prisma CLI, gitignored)
- [x] app/admin/login/page.tsx complet (RHF + Zod + Framer Motion fade-in, design sombre Jolof)
- [x] app/admin/page.tsx créé (server component, getServerSession, redirect si pas de session)
- [x] app/admin/layout.tsx créé
- [x] app/api/auth/reset-password/route.ts créé (placeholder 501 pour Prompt 03)
- [x] npm run build passe sans erreur (8 routes, middleware 49.4 kB)

## Composants Shadcn écrits (22)
button, input, label, card, form, badge, select, textarea, dialog, sheet, dropdown-menu, avatar, separator, skeleton, table, tabs, switch, popover, scroll-area, toast, toaster, use-toast

## Bloqueurs réseau
- Supabase database (`aws-0-eu-west-3.pooler.supabase.com` ports 5432 et 6543) : non joignable depuis le conteneur (host_not_allowed). Conséquence : `npx prisma db push` retourne `P1001: Can't reach database server`. Le seed `npx prisma db seed` est inutilisable tant que la DB n'est pas migrée.
- Supabase API HTTPS (`jzazuschinxqcbyrotsd.supabase.co`) : 403 host_not_allowed.
- Registre Shadcn (`ui.shadcn.com`) : toujours 403, contourné par écriture manuelle des composants.

## Actions à faire par l'utilisateur sur sa machine locale (réseau ouvert)
```bash
# 1. Cloner le repo
git pull origin main
npm install

# 2. Verifier que .env contient DATABASE_URL et DIRECT_URL (cf. .env.local)
# Si .env n'existe pas localement, le creer avec :
#   DATABASE_URL=postgresql://postgres.jzazuschinxqcbyrotsd:Jolof-25streamAKI@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true
#   DIRECT_URL=postgresql://postgres.jzazuschinxqcbyrotsd:Jolof-25streamAKI@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

# 3. Pousser le schema dans Supabase (cree toutes les tables)
npx prisma db push

# 4. Seeder les 2 comptes admin
npx prisma db seed

# 5. Tester en local
npm run dev
# Naviguer vers http://localhost:3000/admin -> doit rediriger vers /admin/login
# Se connecter avec admin1@jolofstream.com / JolofAdmin2026!
# Doit rediriger vers /admin et afficher l'email
```

## Variables .env.local et .env
Toutes en place côté .env.local : DATABASE_URL, DIRECT_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
.env contient DATABASE_URL + DIRECT_URL (lecture Prisma CLI). Les deux fichiers sont gitignored.

## Ce qui reste (Phase 1)
- [ ] Prompt 03 — Layout dashboard (sidebar, topbar, navigation) + flux complet "Mot de passe oublie"
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
- NINEA, numéro RC, adresse officielle, numéro Wave Business non fournis (saisie Paramètres avant lancement — CDC §15)
- Logo Jolof Stream non fourni — placeholder texte
- Photos portfolio/équipe non fournies — placeholders en dev

## Problèmes signalés / décisions prises
- BLOCKER RÉSEAU persistant : conteneur dev coupé de Supabase et de ui.shadcn.com. Composants UI écrits à la main (canonique New-York/Zinc). Migration DB + seed à exécuter en local par l'utilisateur (cf. procédure ci-dessus).
- Lint Next.js 14 a rejeté `interface ... extends ... {}` vide dans input.tsx et textarea.tsx → converti en `type ... = ...`. Idem `actionTypes` non utilisé comme valeur dans use-toast.ts → littéraux inline dans le type Action. Comportement identique.
- Warning Prisma 6 : `package.json#prisma` deprecated en v7 — non bloquant, conservé pour compat v6.

## Prochaine étape
Prompt 03 — Layout dashboard, après que la migration + seed aient été exécutés en local et que la connexion admin1@/admin2@jolofstream.com soit validée.
