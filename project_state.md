# État du projet — Jolof Stream

## Prompt en cours
Prompt 13 — Vue d'ensemble + Journal + Taches (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 12 terminés
- [x] app/api/dashboard/kpis/route.ts : Promise.all KPIs (CA mois courant/precedent, projets en cours, factures impayees count + total, inscriptions en attente, leads semaine, CA par mois sur 12 mois glissants)
- [x] app/api/dashboard/recent/route.ts : derniers_leads + prochains_evenements + activite_recente + taches_du_jour
- [x] app/api/journal/route.ts : GET pagine + filtres entityType/userId/search
- [x] app/api/taches/route.ts : GET (filtre completed/assignedTo, tri non-completees d'abord) + POST + ActivityLog
- [x] app/api/taches/[id]/route.ts : PATCH (titre/date/assignee/completed) + DELETE (createur uniquement, D-040)
- [x] app/api/users/route.ts : GET admins sans password (auth requise)
- [x] components/admin/dashboard/kpi-card.tsx : carte KPI avec trend up/down et 5 couleurs d'accent
- [x] components/admin/dashboard/revenue-chart.tsx : BarChart Recharts responsive, barres rouge #C8151B, tooltip personnalise, axe Y formate K/M
- [x] app/admin/(dashboard)/page.tsx : Vue d'ensemble complete - Server Component avec Promise.all queries Prisma + fallback empty + 4 KPI cards + graphique + 4 widgets (leads, evenements, activite, taches du jour)
- [x] components/admin/journal/journal-tab.tsx : Client Component table avec filtres entite/user/search, badge action color, pagination "Charger plus", relative time avec hover absolute
- [x] components/admin/journal/tasks-tab.tsx : formulaire inline creation, filtres (Toutes/Mes/Autre/Retard), checkbox PATCH, dialog edit + dialog delete (createur only), badges Retard/Aujourd'hui
- [x] app/admin/(dashboard)/journal/page.tsx : Server Component 2 onglets Journal + Taches
- [x] decisions.md : D-039 (KPIs serveur sans cache, 12 mois glissants), D-040 (taches : suppression createur uniquement)
- [x] npm run build OK — 64 routes (8 nouvelles : kpis, recent, journal, taches x2, users + tasks-tab + journal-tab consomment)

## Routes API actives (nouvelles ce prompt)
- `GET /api/dashboard/kpis` (auth, fallback vides)
- `GET /api/dashboard/recent` (auth, fallback vides)
- `GET /api/journal?page=&limit=&entityType=&userId=&search=` (auth, pagine)
- `GET|POST /api/taches` (auth)
- `PATCH|DELETE /api/taches/[id]` (auth, DELETE createur only)
- `GET /api/users` (auth, sans password)

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` execute en local.

## Actions à faire par l'utilisateur sur sa machine locale
```bash
git pull origin main && npm install
npx prisma db push && npx prisma db seed
npm run dev
# Tester /admin (Vue d'ensemble) :
#  - 4 KPI cards avec trend % CA
#  - Graphique CA 12 mois glissants (barres rouge)
#  - Widgets : derniers leads, prochains evenements, activite recente, taches du jour
# Tester /admin/journal :
#  - Onglet "Journal" : filtres entite/user/search, pagination "Charger plus", relative dates
#  - Onglet "Taches" : creer une tache, completer (checkbox), filtrer Mes/Autre/Retard, modifier, supprimer si createur
```

## Ce qui reste (Phase 1)
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- "Calendrier partage CDC §6.9 - vue mensuelle projets + sessions" : non implemente dans ce prompt (juste les 3 prochains evenements en widget). Reportable Phase 2 ou Prompt hotfix avec composant calendar.
- "Cloche notifications topbar CDC §5.3" : la cloche existe en UI dans topbar.tsx mais sans logique de notifications temps reel. Phase 2 avec WebSocket ou polling sur /api/dashboard/recent.
- Flux "Mot de passe oublie" CDC §3.2 : toujours non implemente (reporte Prompt 12, pas concretise ici). A faire en hotfix.

## Problèmes signalés / décisions prises (Prompt 13)
- D-039 : KPIs en Server Component avec Promise.all (8 requetes en parallele). Pas de cache - chaque chargement est frais. Suffisant Phase 1 (< 100 enregistrements). Phase 2 : ajouter unstable_cache ou Edge Functions.
- D-040 : suppression tache limitee au createur. Modification accessible aux 2. ActivityLog distingue completion/re-ouverture/modif simple via la nouvelle valeur de `completed`.
- Recharts Tooltip formatter : Recharts typing strict en `ValueType` (peut etre undefined). Cast Number(value) || 0 pour satisfaire.
- Format relative date : helper local dans dashboard-page et journal-tab (legere duplication acceptable, 8 lignes par implementation).
- Pas de bouton "Nouvelle tache" topbar : le formulaire inline en haut de l'onglet Taches est plus rapide. CustomEvent non branche ici.

## Prochaine étape
Prompt 14 — SEO (sitemap, robots.txt, meta, OG), après Go.
