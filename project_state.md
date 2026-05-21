# État du projet — Jolof Stream

## Prompt en cours
Prompt 01 — Initialisation projet Next.js (TERMINÉ)

## Ce qui est fait
- [x] Lecture du CDC V1.0 complète
- [x] Fichier architecture.md créé
- [x] Fichier claude.md créé
- [x] Fichier decisions.md créé (D-001 à D-012)
- [x] Fichier project_state.md créé
- [x] Branche claude/init-memory-files-epx28 mergée sur main puis supprimée
- [x] Next.js 14.2.35 + TypeScript + Tailwind + App Router + ESLint initialisés
- [x] Toutes les dépendances installées : Prisma 6, NextAuth, Resend, React-PDF, Framer Motion, React Hook Form, Zod, Recharts, Sharp, Supabase JS
- [x] Primitives Radix UI installées (Slot, Label, Select, Dialog, Dropdown, Avatar, Separator, Toast, Popover, ScrollArea, Tabs, Switch)
- [x] Utilitaires Shadcn installés (cva, clsx, tailwind-merge, lucide-react, cmdk, react-day-picker, date-fns, tailwindcss-animate)
- [x] components.json Shadcn écrit (registry CDN bloqué — composants UI à ajouter ultérieurement)
- [x] prisma/schema.prisma complet (18 modèles couvrant section 12.1 du CDC)
- [x] lib/prisma.ts (singleton PrismaClient)
- [x] lib/auth.ts (base NextAuth, authorize() retourne null — sera complété au Prompt 02)
- [x] lib/supabase.ts (clients public + admin)
- [x] lib/utils.ts (cn helper Shadcn)
- [x] next.config.js avec remotePatterns Supabase
- [x] tailwind.config.ts étendu (variables CSS Shadcn + couleurs jolof.rouge/jaune)
- [x] app/globals.css avec directives Tailwind + variables CSS Shadcn Zinc (light + dark)
- [x] app/page.tsx et app/layout.tsx nettoyés (boilerplate supprimé, fr lang, métadonnées Jolof Stream)
- [x] .env.local créé avec toutes les variables (cf. liste à remplir ci-dessous)
- [x] .env et .env.local exclus du git
- [x] npm run build passe sans erreur ni warning bloquant

## Variables .env.local à remplir manuellement
- RESEND_API_KEY : valeur placeholder "REMPLACER_CLE_RESEND" — à remplacer par la clé Resend réelle avant l'envoi d'emails (Prompt 12)

Les autres variables (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) ont été fournies dans le prompt et sont en place.

## Ce qui reste (Phase 1)
- [ ] Prompt 02 — Authentification (NextAuth complet, page login, middleware protection routes /admin, hash bcrypt, seed des 2 comptes admin)
- [ ] Prompt 03 — Layout dashboard (sidebar, topbar, navigation)
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
- NINEA, numéro RC, adresse officielle, numéro Wave Business non fournis (à renseigner dans Paramètres avant lancement — cf. section 15 du CDC)
- Logo Jolof Stream non fourni (PNG/SVG) — placeholder à utiliser en dev
- Photos portfolio/équipe non fournies — placeholders en dev
- PDFKit ou React-PDF : tranché — D-011 React-PDF retenu

## Problèmes signalés
- BLOCKER RÉSEAU PROMPT 01 : le registre Shadcn (ui.shadcn.com) est refusé par la politique réseau de l'environnement de dev (host_not_allowed). La CLI `shadcn add` ne peut pas récupérer les composants. Décision utilisateur (option différer) : installation des seules primitives Radix + utilitaires. components.json est en place mais le dossier components/ui/ est vide. À débloquer au Prompt 02 ou plus tard quand le réseau sera ouvert OU en écrivant les composants manuellement.
- Prisma 7 incompatible avec la syntaxe `directUrl` dans schema.prisma — downgrade effectué vers Prisma ^6 (6.19.3) qui supporte la syntaxe demandée. Aucun impact fonctionnel, schéma identique.

## Prochaine étape
Prompt 02 — Authentification complète après Go reçu (et idéalement après ajout des composants Shadcn UI : button, input, label, form, card minimum requis pour la page login).
