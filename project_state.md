# État du projet — Jolof Stream

## Prompt en cours
Prompt 09 — Module Formations dashboard (TERMINÉ côté code, DB toujours non migrée)

## Ce qui est fait
- [x] Prompts 00 à 08 terminés
- [x] lib/formations.ts : statuts session/inscription, helpers jauge / formatPrice / formatSessionDate / toDatetimeLocal
- [x] lib/schemas.ts mis a jour : trainingSessionSchema (partage client/serveur)
- [x] app/api/formations/sessions/route.ts : GET (search/status) avec counts par statut + remaining, POST avec ActivityLog
- [x] app/api/formations/sessions/[id]/route.ts : GET avec registrations triees + counts, PATCH (rejet si maxSeats < confirmes), DELETE (rejet si confirmes > 0, cascade applicative)
- [x] app/api/formations/inscriptions/[id]/route.ts : PATCH avec actions confirmer/annuler/mettre_en_attente, anti-overbooking, mise a jour automatique du statut session (complet/ouvert), promotion automatique de la liste d'attente lors d'une annulation, ActivityLog detaille
- [x] app/api/formations/inscription/route.ts (public) : verifie session existante + non annulee, compte uniquement en_attente + confirme pour la capacite, gere liste_attente + waitlistPosition
- [x] components/admin/formations/session-form.tsx : Sheet RHF + Zod, datetime-local, validation, ouvert/complet/annule
- [x] components/admin/formations/sessions-table.tsx : cartes avec jauge, badges "Bientot complet" < 20% + "Complet", compteurs 4 stats, filtre statut, ecoute admin:primary-action, dialog suppression
- [x] components/admin/formations/manual-registration-form.tsx : Sheet pour ajout manuel (POST /api/formations/inscription avec sessionId hidden)
- [x] components/admin/formations/session-detail.tsx : recap session avec jauge large, 5 stats, changement statut, encadre lien Wave (placeholder Prompt 11), 4 onglets inscriptions (Toutes/Confirmes/En attente/Liste attente), actions Confirmer/Annuler/Remettre, export CSV BOM UTF-8
- [x] app/admin/(dashboard)/formations/page.tsx : Server Component minimal
- [x] app/admin/(dashboard)/formations/[id]/page.tsx : Server Component avec prisma findUnique + registrations triees + normalisation counts
- [x] decisions.md : D-026 (confirmation manuelle anti-overbooking), D-027 (promotion liste d'attente serveur), D-028 (suppression session conditionnelle)
- [x] npm run build OK — 47 routes

## Routes API actives (nouvelles ce prompt)
- `GET|POST /api/formations/sessions` (auth)
- `GET|PATCH|DELETE /api/formations/sessions/[id]` (auth)
- `GET|PATCH /api/formations/inscriptions/[id]` (auth, action=confirmer|annuler|mettre_en_attente)
- `POST /api/formations/inscription` (publique, mise a jour Prompt 09 pour controles + statut session)

## Bloqueurs réseau (inchangés)
Supabase host_not_allowed. Le module fonctionnera completement une fois `npx prisma db push` execute en local.

## Actions à faire par l'utilisateur sur sa machine locale
```bash
git pull origin main && npm install
# Migration toujours en attente :
npx prisma db push && npx prisma db seed
npm run dev
# Tester /admin/formations :
#  - Nouvelle session (Sheet) -> apparait dans la grille de cartes
#  - Cartes : jauge rouge, badge "Bientot complet" / "Complet", 4 stats
#  - Voir inscriptions -> page detail avec recap + 4 onglets
#  - Ajouter inscription manuelle -> Sheet -> apparait en "En attente"
#  - Bouton "Confirmer paiement" -> passe en "Confirme", session devient "Complet" si plein
#  - Annuler une confirmee -> place liberee + promotion liste d'attente (1er passe en "En attente")
#  - Verification : statut session repasse "Ouvert" automatiquement
#  - Export CSV : telechargement avec BOM UTF-8 pour Excel FR
# Tester site public /formations :
#  - Formulaire -> POST /api/formations/inscription
#  - Si session pleine -> statut "Liste d'attente"
#  - Si session annulee -> 400 explicite
```

## Ce qui reste (Phase 1)
- [ ] Prompt 10 — Module Catalogue Offres + Portfolio dashboard
- [ ] Prompt 11 — Module Paramètres (toutes sections) + lien Wave Business
- [ ] Prompt 12 — Emails automatiques (7 modèles Resend) + flux reset mot de passe + notifications liste d'attente
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Email de notification "place liberee" (CDC §8.1) : la promotion serveur est en place, l'envoi Resend sera branche au Prompt 12. Commentaire dans la route signalant le point d'extension.
- Lien Wave Business dynamique : affiche un placeholder dans le detail session. Le format reel sera renseigne dans Parametres au Prompt 11 puis injecte dans les emails au Prompt 12.

## Problèmes signalés / décisions prises (Prompt 09)
- D-026 : controle anti-overbooking serveur lors de la confirmation. Si la session est deja a maxSeats confirmes, le PATCH retourne 400 explicite.
- D-027 : promotion automatique de la liste d'attente lors d'une annulation. La premiere inscription en liste_attente passe en en_attente (paiement Wave a confirmer), les autres positions sont decrementees dans une transaction.
- D-028 : DELETE session bloque si confirmes > 0 (message explicite). Sinon, cascade applicative pour les inscriptions en_attente/liste_attente.
- Refresh des cartes apres action : router.refresh() depuis le client (re-render du Server Component). Pas de polling, pas d'optimistic update — un vrai aller-retour serveur pour eviter les desynchros entre 2 admins simultanes.
- Export CSV : genere cote client, separateur ; (excel FR), BOM UTF-8 pour eviter les accents casses.

## Prochaine étape
Prompt 10 — Module Catalogue Offres + Portfolio dashboard, après Go.
