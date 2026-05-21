# État du projet — Jolof Stream

## Prompt en cours
Prompt 10 — Catalogue offres + Portfolio dashboard (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 09 terminés
- [x] Schema Prisma : modele `Offer` ajoute (serviceType, name, price, priceLabel, features, isPopular, displayOrder, active). prisma generate OK.
- [x] lib/portfolio.ts : labels/colors types + helpers extractYoutubeId + youtubeThumbnail
- [x] app/api/catalogue/route.ts : GET (groupe par serviceType, filter active=true) + POST + ActivityLog
- [x] app/api/catalogue/[id]/route.ts : PATCH + DELETE + ActivityLog
- [x] app/api/portfolio/route.ts : GET (filtres published/type, limit), POST + ActivityLog
- [x] app/api/portfolio/[id]/route.ts : PATCH + DELETE + ActivityLog
- [x] prisma/seed-catalogue.ts : 4 offres par defaut (CEO Essentiel/Premium, Weekend Solo/Collab) avec upsert idempotent
- [x] prisma/seed.ts : appel `seedCatalogue(prisma)` apres les comptes admin
- [x] components/admin/catalogue/offer-form.tsx : Sheet RHF + Zod, features pills Entree/X, switches popular/active
- [x] components/admin/catalogue/catalogue-board.tsx : 2 sections (CEO, Creator), cartes avec badges Populaire/Actif/Masque, encadre info "modifications temps reel /services", ecoute admin:primary-action, dialog suppression
- [x] app/admin/(dashboard)/catalogue/page.tsx mis a jour
- [x] components/admin/portfolio/portfolio-item-form.tsx : Sheet RHF + Zod, radio photo/youtube, apercu YouTube auto avec fallback maxres -> hqdefault
- [x] components/admin/portfolio/portfolio-grid.tsx : grille 3 colonnes, search debounce + filtres type/published, boutons fleches reordonner (swap displayOrder, D-031), toggle Publier/Depublier, dialog suppression, ecoute admin:primary-action
- [x] app/admin/(dashboard)/portfolio/page.tsx mis a jour
- [x] app/(public)/services/page.tsx : Server Component async, fetch /api/catalogue?active=true avec revalidate 60, fallback hardcode (Captation Live reste 100% hardcode car hors catalogue)
- [x] app/(public)/portfolio/page.tsx : Server Component async, fetch /api/portfolio?published=true avec revalidate 60, mapping db.type -> public labels, fallback hardcode 6 cartes
- [x] components/public/home-sections.tsx : PortfolioPreviewSection avec useEffect fetch /api/portfolio?published=true&limit=5, fallback hardcode 5 cartes, miniatures YouTube auto si applicable
- [x] decisions.md : D-029 (Offer model), D-030 (SSG public DB + fallback), D-031 (reordonnancement Portfolio par fleches)
- [x] npm run build OK — 51 routes (4 nouvelles API)

## Routes API actives (nouvelles ce prompt)
- `GET|POST /api/catalogue`
- `PATCH|DELETE /api/catalogue/[id]`
- `GET|POST /api/portfolio`
- `PATCH|DELETE /api/portfolio/[id]`

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` et `npx prisma db seed` executes en local.

## SQL a executer en local
Le modele Offer a ete ajoute au schema. Sur ta machine locale :
```bash
git pull origin main && npm install
npx prisma generate
npx prisma db push   # cree la table Offer dans Supabase
npx prisma db seed   # seed admins + 4 offres catalogue par defaut
```

## Actions à faire par l'utilisateur sur sa machine locale
```bash
npm run dev
# Tester /admin/catalogue :
#  - Voir les 4 offres par defaut (seed)
#  - Ajouter un forfait, badge "Populaire" / Actif / Masque
#  - Modifier features (Entree pour ajouter, X pour retirer)
#  - Supprimer
# Tester /admin/portfolio :
#  - Ajouter une realisation YouTube -> apercu miniature auto
#  - Publier / depublier (icone Eye/EyeOff)
#  - Reordonner avec ArrowUp/ArrowDown
# Tester site public :
#  - /services : forfaits CEO Content et Creator Weekend depuis DB
#  - /portfolio : realisations publiees depuis DB (filtres fonctionnels)
#  - / (accueil) : section portfolio depuis DB (5 premieres, useEffect)
# Verifier : modifier une offre dans le dashboard, rafraichir /services -> changement visible
```

## Ce qui reste (Phase 1)
- [ ] Prompt 11 — Module Paramètres (toutes sections) + lien Wave Business
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe + notifications liste d'attente
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Service "Captation & Streaming Live" sur /services : CDC §4.4 le presente avec Pack Standard / Premium mais ne le place pas dans le Catalogue (CDC §6.6 reserve le Catalogue aux CEO Content et Creator Weekend). Decision : Captation reste hardcode dans la page. Possible extension future via un serviceType "captation_live" dans Offer.
- Reordonnancement Portfolio CDC §6.7 mentionne "drag & drop" : implemente par boutons fleches (D-031). DnD reporte hors Phase 1.

## Problèmes signalés / décisions prises (Prompt 10)
- D-029 : prisma generate execute sans connexion DB (lecture du schema.prisma uniquement). Build OK sans migration.
- D-030 : /services et /portfolio en SSG avec revalidate 60s. Au build local sans DB, l'API renvoie 500 et le fallback hardcode est utilise -> les pages restent statiques.
- D-031 : reordonnancement par swap des displayOrder via 2 PATCH paralleles. Suffisant pour < 50 items. Pour des centaines, utiliser des LexoRank (Phase 2).
- PortfolioPreviewSection (accueil) : useEffect cote client car home-sections.tsx est deja "use client" pour Framer Motion. Pas de SSG ici.
- Apercu YouTube : try maxresdefault.jpg puis fallback hqdefault.jpg (les videos amateures n'ont pas toujours du maxres).

## Prochaine étape
Prompt 11 — Module Paramètres dashboard, après Go.
