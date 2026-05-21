# État du projet — Jolof Stream

## Prompt en cours
Prompt 07 — Module Projets complet (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 06 terminés
- [x] lib/projets.ts : labels, couleurs, kanban columns, expense categories, formatAmount, formatDate
- [x] app/api/projets/route.ts : GET (search/status/type) + POST avec ActivityLog
- [x] app/api/projets/[id]/route.ts : GET (avec client/quotes/invoices/expenses) + PATCH + DELETE avec garde-fou metier (prospect uniquement) + ActivityLog
- [x] app/api/depenses/route.ts : POST avec ActivityLog (lie a projectId optionnel)
- [x] components/admin/projets/project-form.tsx : Sheet RHF + Zod, select client (fetch /api/clients), tous les champs (titre, type, statut, date, lieu, budget FCFA, notes)
- [x] components/admin/projets/projects-table.tsx : search debounce 300ms, filtres statut/type, bascule vue tableau/kanban, pagination 10/page, skeleton, etat vide, dialog suppression, changement de statut inline (Select dans le tableau, fleches dans le Kanban), ecoute admin:primary-action
- [x] components/admin/projets/expense-form.tsx : Sheet RHF + Zod (categorie, montant, date, description)
- [x] components/admin/projets/project-detail.tsx : fiche gauche (badges, lien client, dates, notes, Select changement statut, boutons Modifier/Supprimer) + 3 onglets (Devis, Factures, Depenses) avec liens vers /admin/devis-factures?projectId=
- [x] app/admin/(dashboard)/projets/page.tsx : Server Component minimal
- [x] app/admin/(dashboard)/projets/[id]/page.tsx : Server Component avec prisma findUnique + 4 relations + notFound() si introuvable
- [x] decisions.md : D-020 (suppression prospect uniquement), D-021 (Kanban sans drag-and-drop)
- [x] npm run build OK — 36 routes (5 nouvelles)

## Routes API actives
- `GET /api/projets?search=&status=&type=` — liste filtree (auth)
- `POST /api/projets` — creation + ActivityLog (auth)
- `GET /api/projets/[id]` — detail avec relations (auth)
- `PATCH /api/projets/[id]` — mise a jour partielle + ActivityLog (auth)
- `DELETE /api/projets/[id]` — suppression bloquee si statut != prospect (auth)
- `POST /api/depenses` — creation depense + ActivityLog (auth)
- `GET|POST /api/clients` + `[id]` — Prompt 06
- `POST /api/formations/inscription`, `POST /api/contact/devis` — Prompt 05

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` execute en local.

## Actions à faire par l'utilisateur sur sa machine locale
```bash
git pull origin main && npm install
# Migration toujours en attente :
npx prisma db push && npx prisma db seed
npm run dev
# Tester /admin/projets :
#  - Bouton "Nouveau projet" topbar -> Sheet (charge la liste des clients)
#  - Creer un projet -> apparait dans la liste
#  - Search debounce + filtres statut/type
#  - Bascule Tableau / Kanban
#  - Changement de statut : Select inline en vue tableau, fleches en Kanban
#  - Eye -> /admin/projets/[id] : fiche + 3 onglets
#  - Onglet Depenses : Ajouter une depense -> Sheet -> total mis a jour
#  - Trash actif seulement pour statut Prospect
```

## Ce qui reste (Phase 1)
- [ ] Prompt 08 — Module Devis & Factures (avec React-PDF)
- [ ] Prompt 09 — Module Formations (dashboard + flux Wave)
- [ ] Prompt 10 — Module Catalogue Offres + Portfolio dashboard
- [ ] Prompt 11 — Module Paramètres (toutes sections)
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- "Checklist technique personnalisable" mentionnee en CDC §6.1 : non implementee en Phase 1 (champ JSON ou table dediee nécessaire). A discuter avant Prompt 11 ou Phase 2.
- Bouton "Ajouter une depense" du topbar Comptabilite (CDC §5.3) : Prompt 07 ajoute seulement la creation depense via la fiche projet. Le module Comptabilite complet (Phase 2) ajoutera l'edition/suppression de depenses + saisie standalone.

## Problèmes signalés / décisions prises (Prompt 07)
- D-020 : DELETE Projet limite a statut prospect (CDC : projets Perdus conserves avec note de raison). Le bouton Trash est `disabled` dans le tableau et masque dans la fiche detail si statut != prospect.
- D-021 : Kanban sans drag-and-drop. Boutons fleches gauche/droite sur chaque carte pour faire avancer/reculer dans les 4 colonnes actives.
- ProjectForm charge dynamiquement la liste des clients via fetch /api/clients au moment de l'ouverture du Sheet. Si aucun client en DB : message clair + bouton "Creer le projet" desactive.
- ExpenseForm sans projectId visible dans l'UI : le projectId est passe en prop et envoye dans le body POST. Conforme au CDC §6.1 (depenses attachees au projet pour calcul de rentabilite).
- Aucune route /api/depenses GET/PATCH/DELETE pour ce prompt (hors scope Phase 1 ; sera complete au module Comptabilite Phase 2).
- ActivityLog ecrit pour CREATE/UPDATE/DELETE Project et CREATE Expense (lie au journal d'activite Prompt 13).

## Prochaine étape
Prompt 08 — Module Devis & Factures, après Go.
