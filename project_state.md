# État du projet — Jolof Stream

## Statut
**Phase 1 TERMINÉE** — Tag `v1.0.0-phase1`
**Phase 3 en cours** — Prompt 28 (Web Push) termine

## Vue d'ensemble
- 28 prompts executes (Prompts 00 a 25 + 27 + 28)
- Module Comptabilite Phase 2 livre : KPIs, graphiques, depenses (CRUD), recettes, rentabilite par projet, exports CSV/Excel/PDF, alertes impayes automatiques (POST /api/comptabilite/alertes)
- Module Contrats Phase 2 livre : CRUD complet, 5 templates PDF avec clauses differenciees (formation vs prestation), statuts (a_envoyer/envoye/signe/refuse/annule), preview iframe, integration onglet projet, signature integree au PDF, Email 8 d'envoi automatique
- Module Mail Marketing Phase 2 livre : CRUD contacts, import/export/sync, editeur campagnes + 5 templates + preview live, tracking ouvertures (pixel GIF) + clics (redirect 302) + desabonnement public, dashboard stats avec BarChart 14 jours et taux ouverture/clic
- Notifications in-app (cloche topbar polling 30s) + Calendrier partage (vue mois/semaine, sources projets+formations+taches)
- Upload Supabase Storage : 4 buckets publics, ImageUpload reutilisable integre dans 4 sections (profil/signature/equipe/portfolio)
- SEO avance Phase 2 : Google Analytics 4, sitemap dynamique DB, JSON-LD 4 schemas, OG image dynamique edge, PWA manifest
- PWA complete Phase 3 : service worker 3 strategies cache, icones edge 192/512/180, page offline, install prompt, exclusions admin/auth/tracking
- Web Push API Phase 3 : VAPID, 3 routes /api/push/*, PushSubscription DB, sendPushToAllAdmins integre dans notifyAllAdmins, UI dans Parametres
- 83 decisions documentees (D-001 a D-083)
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
| §6.4 Comptabilite | Complet (Prompts 16 + 17) - exports Excel/PDF + alertes impayes |
| §6.5 Formations (sessions, inscriptions, Wave, liste d'attente) | Complet |
| §6.6 Catalogue offres | Complet |
| §6.7 Portfolio | Complet |
| §6.8 Contrats | Complet (Prompt 18) - 5 templates PDF, statuts, integration projets |
| §6.9 Journal + Notifications + Taches + Calendrier | Complet (Prompt 23) - cloche fonctionnelle polling 30s + calendrier mois/semaine |
| §7 Flux paiement Wave | Complet (admin manuel) |
| §8 Emails automatiques (7 modeles Resend) | Complet |
| §9 Mail Marketing | Parties A+B+C (Prompts 20-22) - contacts/listes/import/sync + editeur campagnes/templates + tracking ouvertures/clics + desabonnement |
| §10 Parametres (7 sections + 30+ cles) | Complet |
| §11 PDF | Complet (React-PDF + parametres entreprise) |
| §12 Modele de donnees | Complet (+ Offer ajoute) |
| §13 Stack technique | Complet |
| §14 Phases de livraison | Phase 1 atteinte |
| §4.9 SEO | Complet+ (Prompt 25) - GA4, sitemap dynamique DB, JSON-LD, OG image dynamique edge, PWA manifest |

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
83 decisions (D-001 a D-083) dans `decisions.md`. Voir le journal complet pour le detail.

## Phase 2 (en cours)
- [x] **Prompt 16 - Module Comptabilite (livre)** : KPIs (recettes/depenses/benefice/impayes), 2 graphiques (12 mois recettes vs depenses vs benefice + donut depenses par categorie), alerte impayes avec jours de retard, tableau depenses (filtres categorie/recherche, CRUD via Sheet, export CSV), tableau recettes (factures payees, filtre client, export CSV), tableau rentabilite par projet (tri par colonne, barre marge, export CSV). 4 routes API (/api/comptabilite/resume, /depenses, /recettes, /rentabilite). Listener `admin:primary-action` ouvre le Sheet "Ajouter une depense".
- [x] **Prompt 17 - Exports Excel/PDF + alertes impayes (livre)** : route GET /api/comptabilite/export/excel (SheetJS, 4 feuilles, header rouge), route GET /api/comptabilite/export/pdf (React-PDF renderToBuffer, 4 pages, top 3 en jaune), route POST /api/comptabilite/alertes (envoi Email 7 + ActivityLog par facture en retard). Page Comptabilite : period selector (ce_mois/mois_prec/trimestre/annee) qui pilote exports + tableaux, 2 boutons export, bouton orange "Envoyer alertes impayes" avec Dialog de confirmation. Rentabilite API etendue avec dateFrom/dateTo.
- [x] **Prompt 18 - Module Contrats (livre)** : CRUD complet via 3 routes API (/api/contrats GET+POST, /api/contrats/[id] GET+PATCH+DELETE, /api/contrats/[id]/pdf GET avec renderToBuffer). 5 templates PDF (prestation_services / ceo_content / creator_weekend / formation / personnalise) avec 8 articles dont obligations prestataire variables. Statuts a_envoyer/envoye/signe/refuse/annule avec transitions controlees serveur. Pages /admin/contrats (liste avec filtres) et /admin/contrats/[id] (detail + preview iframe + actions). ContratForm Sheet avec auto-fill client a partir du projet et support ?projectId= query param. Integration onglet Contrats sur la fiche projet (/admin/projets/[id]) avec bouton "Nouveau contrat" pre-remplissant le projet.
- [x] **Prompt 19 - PDF contrat avance + email + signature (livre)** : template PDF ameliore (accent rouge 3px, badge CONFIDENTIEL hors formation, refBlock visible, footer paginated avec ref+date, clauses differenciees formation/prestation, zone signature avec image inline si pdf_signature_url renseigne). Email 8 (emails/contrat-envoye.tsx) avec carte info + alert jaune. Route POST /api/contrats/[id]/envoyer (passage a_envoyer -> envoye + envoi email Resend non bloquant + ActivityLog distinguant 3 cas). Bouton "Envoyer par email" dans table + detail (fallback "Marquer envoye" si client sans email). Apercu signature inline dans Parametres (max 200x100px, bouton Effacer). Stats chips (Total / A envoyer / Envoyes / Signes / Refuses+Annules) au-dessus du tableau. Actions regroupees en DropdownMenu pour gagner en lisibilite. next.config.js : remotePattern HTTPS ** pour signatures externes.
- [x] **Prompt 20 - Mail Marketing partie A : contacts/listes/import/sync (livre)** : 6 routes API (/api/marketing/contacts GET+POST, /api/marketing/contacts/[id] GET+PATCH+DELETE, /api/marketing/contacts/import POST avec PapaParse cote client, /api/marketing/contacts/export GET CSV BOM UTF-8, /api/marketing/listes GET counts, /api/marketing/sync POST upsert CRM->Marketing). lib/marketing.ts : LISTES_PREDEFINIES (clients/prospects/formations/newsletter/vip), LISTE_COLORS, getListeLabel, IMPORT_MAX_ROWS=500. UI : ContactForm Sheet avec multi-select listes (toggles + input personnalise), ImportModal Dialog avec preview 5 lignes + listes additionnelles + sample CSV download, ListesSidebar avec counts et separation predefinies/custom, ContactsTable avec stats + boutons globaux (Add/Import/Export/Sync) + filtres + DropdownMenu actions. MarketingView layout 2 colonnes [sidebar 220px + table 1fr]. Topbar mis a jour avec actionLabel "Nouveau contact".
- [x] **Prompt 21 - Mail Marketing partie B : editeur campagnes + templates (livre)** : 4 routes API (/api/marketing/campagnes GET+POST, /api/marketing/campagnes/[id] GET+PATCH+DELETE avec transitions controlees, /api/marketing/campagnes/[id]/preview GET HTML rendu, /api/marketing/campagnes/[id]/stats GET avec destinataires calcules par hasSome lists). lib/campaign-templates.ts : 5 CAMPAIGN_TEMPLATES (nouvelle_formation/offre_service/newsletter/relance_prospect/remerciement) + renderCampaignHtml (template enveloppe rouge Jolof) + CAMPAIGN_STATUSES. UI : CampaignEditor 2 colonnes (formulaire gauche + iframe preview droite debounce 500ms), grille de templates cliquables avec checkmark + option "Contenu personnalise", toolbar HTML minimale (Bold/Italic/Link/H2/List) qui entoure la selection courante, multi-select listes avec counts en temps reel, datetime-local pour planification. Pages : /admin/mail-marketing/campagnes/nouvelle (CampaignCreateView Sauvegarder/Planifier) et /admin/mail-marketing/campagnes/[id] (CampaignDetailView edit si brouillon, lecture seule + stats si planifie/envoye/annule). CampagnesList integre dans MarketingView en 2eme onglet (Contacts | Campagnes), avec stats globales, search, filtres statut, DropdownMenu (Voir/Modifier/Dupliquer/Supprimer), pagination 10.
- [x] **Prompt 22 - Mail Marketing partie C : tracking ouvertures/clics + desabonnement + stats (livre)** : 2 nouveaux modeles Prisma CampaignOpen + CampaignClick (Cascade campaignId, index sur campaignId/contactEmail). 3 nouvelles routes API publiques : /api/marketing/track/open (GET pixel GIF 1x1 transparent), /api/marketing/track/click (GET redirect 302 vers safeUrl), /api/marketing/unsubscribe (GET met unsubscribed=true + page HTML confirmation). Mise a jour /api/marketing/campagnes/[id]/stats avec vraies stats (ouverts/uniques/taux + clics/uniques/taux + desabonnes + series 14 jours). renderCampaignHtmlWithTracking dans lib/campaign-templates.ts : resolution {{prenom}}/{{nom}}/{{email}} + wrapping <a href> avec lien tracker (exclut {{, #, mailto:, tel:) + insertion pixel + lien desabonnement. UI : CampaignStatsDashboard nouveau composant (4 KPIs accent stripes + BarChart 14 jours ouvertures/clics + recap stats) + bouton actualiser refresh. CampaignDetailView affiche le dashboard si status=envoye ou planifie. SQL fourni en annexe pour Supabase (db push local requis).
- [x] **Prompt 23 - Notifications + Calendrier (livre)** : modele Prisma Notification (Cascade + indexes userId/read). 3 routes API (/api/notifications GET avec unread_count, /api/notifications/[id] PATCH verifie ownership, /api/notifications/read-all POST). Helpers lib/notifications.ts (createNotification + notifyAllAdmins). 4 branchements : nouveau_lead (POST /api/contact/devis), nouvelle_inscription (POST /api/formations/inscription), paiement_confirme (action confirmer dans /api/formations/inscriptions/[id]), tache_assignee (POST /api/taches si assignedTo != createur). NotificationsBell composant (Popover Radix, polling 30s setInterval, badge rouge avec count 9+, marquer lu individuellement ou en masse, icones par type). Topbar refactoree pour utiliser NotificationsBell au lieu du placeholder. Calendrier : route GET /api/calendrier?year&month avec fusion Project+TrainingSession+Task (taches en retard si dueDate < today). CalendrierView composant maison (pas de lib externe) avec vue mois (grille 6x7 alignee lundi, max 2 pills par cellule, jour courant en cercle rouge) et vue semaine (7 colonnes verticales avec events listes complets), Sheet lateral pour detail d'un jour, navigation prev/next/aujourd'hui, legende couleurs. Sidebar : Calendrier ajoute dans groupe Equipe.
- [x] **Prompt 24 - Upload Supabase Storage (livre)** : 2 routes API (/api/storage/upload POST FormData avec validation type+taille 5MB+sanitize filename, /api/storage/delete DELETE avec parse URL publique vers path). Composant ImageUpload reutilisable (3 ratios square/landscape/signature, drag&drop avec onDragOver/onDrop, loading states, suppression best-effort via extractPathFromPublicUrl). 4 integrations : Parametres > Mon profil (bucket avatars), Parametres > Documents PDF (bucket signatures, remplace l'apercu manuel inline), Parametres > Contenu > Equipe (bucket equipe, remplace input URL), Portfolio item form (bucket portfolio si mediaType=photo, YouTube URL inchangee). 4 buckets Supabase a creer manuellement (instructions dans le rapport).
- [x] **Prompt 25 - SEO avance + GA4 + PWA manifest (livre)** : @next/third-parties (v16.2.6) avec GoogleAnalytics dans root layout conditionnel sur NEXT_PUBLIC_GA_ID. Sitemap dynamique async (portfolio publie + formations ouvertes, try/catch independants pour fallback statique). components/public/json-ld.tsx + 4 schemas Schema.org (Organization accueil, Service /services, EducationalOrganization /formations, LocalBusiness /contact). app/(public)/opengraph-image.tsx via next/og ImageResponse runtime edge (1200x630 fond ink + gradient rouge + titre jaune italic). Metadata root pointe vers /opengraph-image. app/manifest.ts (display standalone, theme rouge, ink background, logo couleur). Viewport themeColor + appleWebApp. Header Link preconnect Google Fonts dans next.config.js. NEXT_PUBLIC_GA_ID ajoute dans .env.vercel.example.

## Phase 2 TERMINÉE — Récapitulatif
- Comptabilite complete (Prompts 16+17) : KPIs, graphiques, depenses CRUD, recettes, rentabilite, exports Excel/PDF/CSV, alertes impayes
- Contrats complets (Prompts 18+19) : CRUD, 5 templates PDF avec signature, email envoi, statuts
- Mail Marketing complet (Prompts 20+21+22) : contacts/import/sync, editeur campagnes + templates, tracking ouvertures/clics + desabonnement
- Notifications + Calendrier (Prompt 23) : cloche polling 30s + calendrier maison mois/semaine
- Upload Supabase Storage (Prompt 24) : 4 buckets + ImageUpload reutilisable
- SEO avance + PWA (Prompt 25) : GA4, sitemap dynamique, JSON-LD, OG image edge, manifest
- [ ] Flux "Mot de passe oublie" complet (token + email + page reset)
- [ ] Cloche notifications temps reel (WebSocket ou polling)
- [ ] Calendrier partage mensuel
- [ ] Relances factures impayees automatiques (cron Vercel)
- [ ] 2FA

## Phase 3 (en cours)
- [x] **Prompt 27 - PWA complete (livre)** : service worker public/sw.js avec 3 strategies (Cache First assets, Network First HTML avec fallback /offline, Stale While Revalidate API publique). Exclusions admin/auth/notifications/tracking/storage. 3 icones edge (icon-192/icon-512/apple-icon) via next/og avec design rouge + cercle jaune + play blanc + texte jolof. Manifest enrichi (orientation portrait, categories, purpose maskable). Page /offline design ink + bouton reload + retour home. PwaRegister (load + register) et PwaInstallPrompt (banner beforeinstallprompt + dismiss localStorage 7 jours) montes dans app/(public)/layout.tsx.
- [x] **Prompt 28 - Web Push API (livre)** : web-push (3.6.7), VAPID keys generees + 3 env vars documentees. Modele Prisma PushSubscription (endpoint unique, p256dh, auth, userAgent, index userId, Cascade). 3 routes API publiques sur /api/push (subscribe POST upsert, unsubscribe DELETE ownership, test POST envoi a soi-meme). lib/push-notifications.ts : sendPushToUser (cleanup statusCode 410/404 auto) + sendPushToAllAdmins + configureVapid lazy. SW etendu : push event handler avec showNotification, notificationclick handler avec focus/openWindow. PushSubscribe composant 4-etats (loading/unsupported/denied/granted+subscribed) integre dans Parametres > Mon profil. PwaRegister monte aussi sur admin layout (D-083). notifyAllAdmins envoie push en parallele (non bloquant) ; createNotification envoie push a un user specifique. Cles VAPID generees dans le rapport, SQL fourni en annexe.
- [ ] Stockage Supabase des PDF contrats signes uploads (file_url)
- [ ] Signatures electroniques integrees (DocuSign / equivalent)
- [ ] Cron Vercel pour envoi automatique des campagnes planifiees
- [ ] Cron relances factures impayees automatiques
- [ ] Schema FAQPage sur /contact (FAQ accordion existant)
- [ ] A/B testing sur campagnes
- [ ] Restriction du remotePattern HTTPS ** (D-057) une fois les domaines de signatures connus

## Phase 4
- Analytics site public
- Optimisations SEO avancees (blog)
- Formation sur mesure entreprise
