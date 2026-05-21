# Architecture — Jolof Stream

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
- Chaque action UI a une route API — aucun bouton sans action

## URL structure
- jolofstream.com/ → site public
- jolofstream.com/admin → dashboard (auth requise)
- jolofstream.com/admin/login → page connexion
- Redirection www → sans www automatique

## Couleurs Jolof Stream
- Rouge : #C8151B
- Jaune : #F5B800
