# État du projet — Jolof Stream

## Prompt en cours
Prompt 06 — Logos integres + Module CRM Clients complet (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 05B terminés
- [x] Partie A — Logos
  - components/public/logo.tsx (variant=couleur par defaut)
  - components/admin/logo.tsx (variant=blancJaune par defaut)
  - Navbar : logo couleur 140x42
  - Footer : logo blancJaune 140x42
  - Sidebar admin : logo blancJaune 130x40
  - Page login : logo blancJaune 160x48
  - Fallback onError silencieux (display:none si PNG absent)
- [x] Partie B — Module CRM Clients
  - lib/clients.ts : labels et couleurs de badges pour types, statuts, canaux d'acquisition + helper initialsOf
  - app/api/clients/route.ts : GET avec filtres (search/status/type) + POST (validation Zod + ActivityLog)
  - app/api/clients/[id]/route.ts : GET detail (avec projets/devis/factures + counts) + PATCH (validation + ActivityLog) + DELETE (avec message d'erreur explicite sur les FK)
  - components/admin/clients/clients-table.tsx : tableau, recherche debounce 300ms, filtres statut/type, pagination 10/page, skeleton loading, etat vide, ecoute CustomEvent admin:primary-action, dialog confirmation suppression
  - components/admin/clients/client-form.tsx : Sheet RHF + Zod, tous les champs CDC § 6.2, label rouge sur switch TVA, gestion tags (Entree pour ajouter, pills supprimables)
  - components/admin/clients/client-detail.tsx : fiche client gauche (avatar initiales rouge, badges, contacts, tags, notes, boutons Modifier/Supprimer) + 3 onglets historique (Projets, Devis, Factures) avec etat vide et liens
  - app/admin/(dashboard)/clients/page.tsx : Server Component minimal qui rend ClientsTable
  - app/admin/(dashboard)/clients/[id]/page.tsx : Server Component qui charge prisma.client.findUnique avec projets/devis/factures + render ClientDetailView
- [x] decisions.md : D-018 (logos), D-019 (suppression CRM)
- [x] npm run build OK — 31 routes (5 nouvelles : /admin/clients, /admin/clients/[id], /api/clients, /api/clients/[id])

## Routes API actives
- `GET /api/clients?search=&status=&type=` — liste filtree des clients (auth requise)
- `POST /api/clients` — creation client + ActivityLog (auth requise)
- `GET /api/clients/[id]` — detail avec relations (auth requise)
- `PATCH /api/clients/[id]` — mise a jour partielle + ActivityLog (auth requise)
- `DELETE /api/clients/[id]` — suppression + ActivityLog (refus si FK contraintes)
- `POST /api/formations/inscription` — inscription publique (Prompt 05)
- `POST /api/contact/devis` — demande de devis publique (Prompt 05)
- `GET|POST /api/auth/[...nextauth]` — NextAuth

## Bloqueurs réseau (inchangés)
- Supabase database et API : host_not_allowed
- Le module CRM fonctionnera completement en local des que `npx prisma db push` aura ete execute

## Actions à faire par l'utilisateur sur sa machine locale
1. Deposer les 3 PNG dans public/logos/ :
   - Logo_JolofStream_couleur.png
   - Logo_JolofStream_blanc.png
   - Logo_JolofStream_blancJaune.png
2. Migration et seed DB toujours en attente :
```bash
git pull origin main && npm install
npx prisma db push && npx prisma db seed
npm run dev
# Tester /admin/clients :
#  - Bouton "Nouveau client" (topbar) ouvre le Sheet
#  - Creation -> apparait dans la liste
#  - Recherche en temps reel + filtres statut/type
#  - Pagination 10/page
#  - Eye -> /admin/clients/[id] : fiche + 3 onglets
#  - Pencil -> Sheet d'edition pre-rempli
#  - Trash -> dialog confirmation -> DELETE
# Verifier que les leads crees via /contact apparaissent dans la liste
```

## Ce qui reste (Phase 1)
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
- Logos PNG non fournis encore. Composants Logo en place avec fallback silencieux (display:none) — les fichiers seront integres une fois fournis dans public/logos/.
- Reseaux sociaux : tous en `#` jusqu'au Prompt 11.

## Problèmes signalés / décisions prises (Prompt 06)
- Zod 4 : `error.errors` deprecie au profit de `error.flatten().fieldErrors`. Les deux routes /api/clients ont ete corrigees. Pattern partage en `lib/schemas.ts` deja conforme.
- DELETE Client : si FK contraintes (projets/devis/factures associes), Prisma jette une erreur P2003. La route renvoie un message en clair "Suppression impossible. Verifiez que le client n'a pas de projet, devis ou facture associes." (D-019)
- D-018 (logos) : composants Logo avec onError. Si les PNG manquent (cas actuel du conteneur dev), l'image est cachee silencieusement. Aucun layout shift majeur car next/image reserve la place selon width/height.
- ActivityLog cree a chaque CREATE/UPDATE/DELETE Client cote dashboard (auth admin). Cote public (/api/contact/devis) le log reste hors scope tant qu'il n'y a pas de userId admin a relier (resolu Prompt 12 via notification + log d'admin systeme).

## Prochaine étape
Prompt 07 — Module Projets, après Go.
