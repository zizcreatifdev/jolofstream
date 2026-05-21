# État du projet — Jolof Stream

## Prompt en cours
Prompt 08 — Module Devis et Factures (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 07 terminés
- [x] lib/documents.ts : nomenclature DEV-AAAA-JS-XXX / FAC-AAAA-JS-XXX, BRS 5%, TVA 18%, calculateTotals, labels et badges statuts/types, formatAmount/Date
- [x] app/api/devis/route.ts : GET (search/status/clientId/projectId) + POST (sequence annuelle dans transaction Prisma, calcul totaux, propagation TVA exoneree) + ActivityLog
- [x] app/api/devis/[id]/route.ts : GET (avec client/project/lines/invoices) + PATCH (recalcul totaux, suppression+recreation des lignes en transaction) + DELETE (brouillon uniquement, D-022)
- [x] app/api/devis/[id]/convertir/route.ts : POST conversion devis -> facture (lignes copiees, lien quoteId conserve)
- [x] app/api/factures/route.ts : GET (search/status/type/client/project) + POST (sequence annuelle) + ActivityLog
- [x] app/api/factures/[id]/route.ts : GET + PATCH limite au statut (pas de modification des lignes, D-023) + paidAt automatique sur statut payee
- [x] app/api/factures/[id]/avoir/route.ts : POST creation avoir avec montants negatifs, reference FAC-AAAA-JS-XXX-AVOIR (D-023), garde-fou contre avoir-sur-avoir et duplication
- [x] components/admin/documents/pdf-template.tsx : Document/Page/Text/View universel (sans hook navigateur)
- [x] components/admin/documents/pdf-preview.tsx : PDFViewer wrapper "use client" (importe via dynamic ssr:false, D-024)
- [x] components/admin/documents/pdf-download.tsx : PDFDownloadLink wrapper "use client" (D-024)
- [x] components/admin/documents/document-form.tsx : Sheet large (sm:max-w-[1180px]), 2 colonnes form + preview PDF live, useFieldArray pour lignes, calcul temps reel BRS/TVA, propagation TVA exoneree depuis client charge dynamiquement, charge /api/clients et /api/projets a l'ouverture, filtrage projets par client
- [x] components/admin/documents/documents-tabs.tsx : 2 onglets Devis/Factures, panneaux search + filtres + pagination 10/page + skeleton + dialog suppression + ecoute admin:primary-action + read query param ?projectId=
- [x] components/admin/documents/document-detail.tsx : layout 2 colonnes (fiche + preview PDF iframe), boutons actions selon statut (Modifier devis brouillon, Convertir devis accepte, Marquer payee facture emise, Creer avoir facture non-annulee non-avoir, Supprimer devis brouillon), telechargement PDF via PdfDownload, changement statut inline
- [x] app/admin/(dashboard)/devis-factures/page.tsx : Server Component minimal + Suspense pour useSearchParams
- [x] app/admin/(dashboard)/devis-factures/[id]/page.tsx : Server Component qui charge devis OU facture selon searchParam kind, normalise vers DocumentDetail
- [x] decisions.md : D-022 (suppression devis brouillon), D-023 (factures immutables + avoirs), D-024 (React-PDF dynamic ssr:false), D-025 (compteur annuel via count en transaction)
- [x] npm run build OK — 42 routes

## Routes API actives
- `GET|POST /api/devis` (auth)
- `GET|PATCH|DELETE /api/devis/[id]` (auth, DELETE brouillon only)
- `POST /api/devis/[id]/convertir` (auth, devis accepte uniquement)
- `GET|POST /api/factures` (auth)
- `GET|PATCH /api/factures/[id]` (auth, PATCH statut only)
- `POST /api/factures/[id]/avoir` (auth, garde-fou avoir-sur-avoir + duplication)
- + toutes routes precedentes (clients, projets, depenses, formations, contact, auth)

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` execute en local.
Preview PDF (React-PDF) genere cote client a partir du DOM — aucune dependance reseau.

## Actions à faire par l'utilisateur sur sa machine locale
```bash
git pull origin main && npm install
# Migration toujours en attente :
npx prisma db push && npx prisma db seed
npm run dev
# Tester /admin/devis-factures :
#  - Onglet Devis : Nouveau devis -> Sheet large avec preview PDF live cote droit
#  - Remplir lignes -> totaux recalcules + preview mise a jour
#  - Toggler client TVA exonere -> TVA auto desactivee + badge dans le PDF
#  - Soumettre -> apparait dans la liste avec reference DEV-2026-JS-001
#  - Marquer devis Accepte -> bouton Convertir actif -> creer facture FAC-2026-JS-001
#  - Onglet Factures : Marquer payee, creer un avoir
#  - Detail devis/facture -> preview iframe + telechargement PDF
#  - Suppression devis brouillon uniquement
```

## Ce qui reste (Phase 1)
- [ ] Prompt 09 — Module Formations (dashboard + flux Wave)
- [ ] Prompt 10 — Module Catalogue Offres + Portfolio dashboard
- [ ] Prompt 11 — Module Paramètres (toutes sections)
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Templates de devis (CDC §6.3.2) : les 7 templates pre-remplis (Captation Standard, Premium, CEO Essentiel, etc.) ne sont pas integres dans le Prompt 08. Ils dependent du Catalogue (Prompt 10) qui contiendra la bibliotheque de prestations.
- Acompte automatique (CDC §6.3.4) : la conversion devis -> facture accepte un type "acompte" mais le pourcentage et la facture-de-solde automatique seront branches au Prompt 10 ou via UI dediee plus tard.
- Relances automatiques d'impayes (CDC §6.3.6) : Phase 2 (cron + Resend).

## Problèmes signalés / décisions prises (Prompt 08)
- 3 erreurs lint Next.js corrigees a la volee : variable subject inutilisee + 2 assertions `as "literal"` remplacees par `as const`. Aucun comportement modifie.
- React-PDF + Next.js SSR : isolation stricte via composants pdf-preview.tsx et pdf-download.tsx importes uniquement en dynamic ssr:false. Le PdfTemplate (Document/Page/Text/View) ne touche jamais a window/document et reste importable partout.
- Sheet large : override sm:!max-w-[1180px] via cn() pour permettre le layout 2 colonnes (form + preview PDF). Pattern propre, ne change pas le Sheet de base utilise ailleurs.
- ProjectId via query param : la page lit useSearchParams() (cote client via documents-tabs.tsx). Le wrapper Suspense est requis par Next.js 14 pour useSearchParams.
- Compteur de reference : count() filtre sur startsWith DEV-AAAA-JS- en transaction Prisma. Risque de race condition theorique entre 2 admins creant un devis en meme temps - probabilite tres faible en pratique (2 utilisateurs, < 100 devis/an attendus). Si besoin reel, ajouter une table sequence dediee Phase 2.
- Modification devis : les lignes sont supprimees puis recreees en transaction (deleteMany + create). Plus simple que d'aligner les diffs, et garantit la coherence des totaux.

## Prochaine étape
Prompt 09 — Module Formations dashboard, après Go.
