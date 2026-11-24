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

## Site public V2 "Cinema plein ecran" (refonte en 6 prompts, D-163 a D-171)
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

Design : tokens Tailwind cine-* (fonds #050303 / #0E0908 / #161010, creme #F4F0EA / #EAE4DB, encre #1A1110, rouge #C8151B / #8F0E12, jaune #F5B800). Polices : Instrument Serif (titres), Bricolage Grotesque (texte), JetBrains Mono via next/font (font-mono, etiquettes et timecode). Interdits : bandes colorees sur le bord des cartes, halos ou formes floues, degrades sur les barres de progression, pointilles, emojis, tiret long.

## Migrations de base
Le schema est synchronise a la main : chaque evolution fournit un SQL a executer dans l'editeur SQL Supabase. Depuis D-168, le SQL est aussi range dans prisma/migrations/<horodatage>_<nom>/migration.sql (idempotent), sans execution automatique au deploiement. Apres une migration : redeploiement Vercel sans cache (client Prisma regenere).
