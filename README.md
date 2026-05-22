# Jolof Stream — Plateforme de gestion

Plateforme centralisee pour Jolof Stream : site public (vitrine + inscriptions formations + leads) et dashboard admin (CRM, projets, devis et factures, formations, catalogue, portfolio, parametres, journal d'activite, taches).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Shadcn/UI (composants ecrits localement) · Framer Motion · Recharts · React-PDF · Prisma 6 · Supabase (PostgreSQL + Storage) · NextAuth.js · Resend · Vercel.

## Developpement local

```bash
git clone <repo>
cd jolofstream
npm install               # postinstall execute prisma generate
cp .env.vercel.example .env.local   # puis remplir les valeurs reelles
npx prisma db push        # cree les tables Supabase
npx prisma db seed        # 2 comptes admin + 4 offres catalogue + parametres
npm run dev
```

## Variables d'environnement

Voir `.env.vercel.example` pour la liste complete. Variables critiques :
- `DATABASE_URL` / `DIRECT_URL` (Supabase)
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET`
- `RESEND_API_KEY` / `EMAIL_FROM` (par defaut `onboarding@resend.dev`)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

## Deploiement Vercel

1. Connecter le repo GitHub a Vercel.
2. Configurer les variables d'environnement depuis `.env.vercel.example`.
3. Le `buildCommand` (defini dans `vercel.json`) execute `npx prisma generate && npm run build`.
4. Apres le premier deploiement, depuis une machine locale connectee a Supabase :
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. Renseigner les Parametres dans le dashboard `/admin/parametres` (NINEA, RC, Wave, equipe, etc.).
6. Connecter le domaine `jolofstream.com` (LWS) puis mettre a jour `NEXTAUTH_URL` et `NEXT_PUBLIC_SITE_URL`.
7. Verifier le domaine `notifications@jolofstream.com` sur Resend (DNS DKIM/SPF), puis basculer `EMAIL_FROM`.

## Comptes admin par defaut (apres seed)

- `admin1@jolofstream.com` / `JolofAdmin2026!`
- `admin2@jolofstream.com` / `JolofAdmin2026!`

**Changer ces mots de passe immediatement apres le premier login** (`/admin/parametres` > Mon profil).

## Structure

```
app/(public)/        Site public (Accueil, Services, Formations, Portfolio, A propos, Contact, CGV, Mentions)
app/admin/(auth)/    Page de login admin
app/admin/(dashboard)/  Dashboard admin (12 modules)
app/api/             Routes API REST
components/public/   Composants site public
components/admin/    Composants dashboard
components/ui/       22 composants Shadcn/UI ecrits manuellement
emails/              7 templates React Email
lib/                 Helpers, schemas Zod, types partages
prisma/              schema.prisma + seed.ts
public/logos/        3 PNG du logo (couleur, blanc, blancJaune)
```

## Documentation interne

- `architecture.md` : conventions et structure
- `claude.md` : regles de developpement
- `decisions.md` : journal des decisions techniques (D-001 a D-042)
- `project_state.md` : etat d'avancement et checklist lancement
- `jolofstream_cahier_des_charges.md` : CDC V1.0
