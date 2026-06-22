# État du projet — Jolof Stream

## Statut
**Phase 1 TERMINÉE** — Tag `v1.0.0-phase1`
**Phase 2 en cours** — Prompt 16 (Module Comptabilite) termine

## Vue d'ensemble
- 17 prompts executes (Prompts 00 a 16) + correctif recu formation
- Module Comptabilite Phase 2 livre : KPIs, graphiques, depenses (CRUD), recettes, rentabilite par projet, alertes impayes, exports CSV
- Module Formations etendu : recu PDF de paiement (React-PDF renderToBuffer) + partage WhatsApp depuis le detail session
- 49 decisions documentees (D-001 a D-049)
- npm run build : OK
- TypeScript : 0 erreur
- ESLint : 0 warning

## Audit final (Prompt 15)

### Migration DB
Tentative depuis le conteneur : echec attendu (`P1001: Can't reach database server at aws-0-eu-west-3.pooler.supabase.com`).
Le reseau du conteneur Claude Code n'autorise pas Supabase. **Migration a executer en local par l'utilisateur** avec `npx prisma db push && npx prisma db seed`.

### Routes API non referencees par une UI (intentionnel)
- `GET /api/dashboard/kpis` et `/api/dashboard/recent` : la page `/admin` lit directement Prisma en Server Component (plus rapide qu'un fetch HTTP). Routes API conservees pour usage Phase 2 (polling, widgets clients embarquables, notifications temps reel).
- `GET /api/users` : la page `/admin/journal` lit directement `prisma.user.findMany`. Route API conservee pour futurs selecteurs client-side.
- `POST /api/auth/reset-password` : placeholder 501 explicite, branche au Prompt 12 hotfix ou Phase 2 (flux mot de passe oublie).

Aucune route bloquante, aucun bouton sans action.

### Liens internes
14 routes statiques + dynamiques `[id]` : tous valides.
`/admin/login?reset=true` accepte le query param sans crash (page de login normale).

### Couverture du CDC

| Module CDC | Statut |
| --- | --- |
| §4 Site public (6 pages + CGV + Mentions) | Complet |
| §5 Layout dashboard | Complet |
| §6.1 Projets (avec rentabilite via depenses) | Complet |
| §6.2 CRM Clients (avec exoneration TVA propagee) | Complet |
| §6.3 Devis et Factures (BRS/TVA, acompte, avoirs, conversion, PDF) | Complet |
| §6.4 Comptabilite | Complet (Prompt 16) - exports Excel/PDF reportes (D-047) |
| §6.5 Formations (sessions, inscriptions, Wave, liste d'attente) | Complet |
| §6.6 Catalogue offres | Complet |
| §6.7 Portfolio | Complet |
| §6.8 Contrats | Phase 3 (D-009) |
| §6.9 Journal + Notifications + Taches + Calendrier | Complet sauf calendrier mensuel (widget evenements seulement) |
| §7 Flux paiement Wave | Complet (admin manuel) |
| §8 Emails automatiques (7 modeles Resend) | Complet |
| §9 Mail Marketing | Phase 2 (D-009) |
| §10 Parametres (7 sections + 30+ cles) | Complet |
| §11 PDF | Complet (React-PDF + parametres entreprise) |
| §12 Modele de donnees | Complet (+ Offer ajoute) |
| §13 Stack technique | Complet |
| §14 Phases de livraison | Phase 1 atteinte |
| §4.9 SEO | Complet (sitemap, robots, OG, meta) |

### Bloqueurs reseau (conteneur Claude Code)
- Supabase DB : `host_not_allowed` -> migration et seed a faire en local
- Resend API : `host_not_allowed` -> envoi emails fonctionnera sur Vercel
- Ces blocages ne sont **pas** des bugs du code, c'est la policy reseau de l'environnement de developpement Claude Code

## Variables d'environnement
- `.env.local` : remplie (DB, NextAuth, Resend, Supabase, SITE_URL)
- `.env.vercel.example` : template documente pour Vercel

## Comptes admin par defaut (apres seed)
- `admin1@jolofstream.com` / `JolofAdmin2026!`
- `admin2@jolofstream.com` / `JolofAdmin2026!`

## Checklist pre-lancement (a executer en dehors de Claude Code)

### Deploiement initial
- [ ] Connecter le repo GitHub a Vercel
- [ ] Configurer les variables d'environnement sur Vercel (voir `.env.vercel.example`)
- [ ] Generer un `NEXTAUTH_SECRET` de production : `openssl rand -base64 32`
- [ ] Premier deploiement Vercel -> verifier build vert
- [ ] Executer `npx prisma db push` depuis machine locale (creer toutes les tables)
- [ ] Executer `npx prisma db seed` depuis machine locale (admins + catalogue + parametres)

### Configuration post-deploiement
- [ ] Se connecter au dashboard sur URL Vercel
- [ ] Changer les mots de passe des 2 comptes admin
- [ ] Parametres > Entreprise : NINEA, RC, adresse, numero Wave Business, lien Wave template
- [ ] Parametres > Reseaux sociaux : 5 URLs reelles
- [ ] Parametres > Mon profil : nom et email de chaque cofondateur
- [ ] Parametres > Contenu du site : histoire, mission, equipe (vraies photos 400x400px), 4 stats
- [ ] Parametres > Notifications : admin1_email et admin2_email (peuvent etre identiques aux emails de login ou differents)
- [ ] Parametres > Documents PDF : footer text + signature URL

### Domaine et DNS
- [ ] Connecter `jolofstream.com` (LWS) a Vercel
- [ ] Mettre a jour `NEXTAUTH_URL="https://jolofstream.com"` sur Vercel
- [ ] Mettre a jour `NEXT_PUBLIC_SITE_URL="https://jolofstream.com"` sur Vercel
- [ ] Verifier la redirection `www` -> sans www (config Vercel)

### Resend
- [ ] Verifier le domaine `jolofstream.com` sur Resend (DKIM/SPF/DMARC)
- [ ] Mettre a jour `EMAIL_FROM="Jolof Stream <notifications@jolofstream.com>"` sur Vercel
- [ ] Tester l'envoi d'un email de test depuis /contact

### Contenu initial
- [ ] Remplacer `public/og-image.png` par une vraie image 1200x630px aux couleurs Jolof Stream
- [ ] Ajouter les premieres realisations dans Portfolio (admin)
- [ ] Creer les premieres sessions de formation
- [ ] Verifier les textes CGV et Mentions legales avec un juriste

### Tests finaux en production
- [ ] Tester `/contact` -> demande de devis -> email aux admins
- [ ] Tester `/formations` -> inscription -> email confirmation candidat
- [ ] Tester connexion admin1 et admin2
- [ ] Tester creation devis brouillon -> envoi par email -> PDF telecharge
- [ ] Tester conversion devis accepte -> facture creee -> email client
- [ ] Tester marquage facture payee
- [ ] Tester ajout/publication d'une realisation Portfolio
- [ ] Verifier les modifications du Catalogue refletees sur /services en moins de 60s
- [ ] Verifier toutes les pages du site public en mobile/tablette
- [ ] Connecter Google Search Console (apres indexation)

## Decisions documentees
49 decisions (D-001 a D-049) dans `decisions.md`. Voir le journal complet pour le detail.

## Phase 2 (en cours)
- [x] **Prompt 16 - Module Comptabilite (livre)** : KPIs (recettes/depenses/benefice/impayes), 2 graphiques (12 mois recettes vs depenses vs benefice + donut depenses par categorie), alerte impayes avec jours de retard, tableau depenses (filtres categorie/periode/recherche, CRUD via Sheet, export CSV), tableau recettes (factures payees, filtre client/periode, export CSV), tableau rentabilite par projet (tri par colonne, barre marge, export CSV). 4 routes API (/api/comptabilite/resume, /depenses, /recettes, /rentabilite). Listener `admin:primary-action` ouvre le Sheet "Ajouter une depense".
- [ ] Mail Marketing (listes, campagnes, statistiques)
- [ ] Flux "Mot de passe oublie" complet (token + email + page reset)
- [ ] Cloche notifications temps reel (WebSocket ou polling)
- [ ] Calendrier partage mensuel
- [ ] Relances factures impayees automatiques (cron Vercel)
- [ ] 2FA
- [ ] Comptabilite exports Excel (.xlsx) et PDF (D-047)

## Phase 3
- Contrats (modeles, generation pre-remplie, stockage signe)
- Statistiques mail marketing (ouverture, clic)

## Phase 4
- Analytics site public
- Optimisations SEO avancees (blog)
- Formation sur mesure entreprise
