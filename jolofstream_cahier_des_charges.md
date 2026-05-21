# Cahier des Charges — Plateforme Jolof Stream
**Version** : 1.0  
**Date** : Mai 2026  
**Statut** : Validé — Prêt pour développement  
**Stack** : Next.js 14 · TypeScript · Supabase · Prisma · Vercel  

---

## Sommaire

1. [Contexte & Objectifs](#1-contexte--objectifs)
2. [Architecture générale](#2-architecture-générale)
3. [Authentification & Sécurité](#3-authentification--sécurité)
4. [Site Public](#4-site-public)
5. [Dashboard Admin](#5-dashboard-admin)
6. [Modules du Dashboard](#6-modules-du-dashboard)
7. [Flux Paiement Formations](#7-flux-paiement-formations)
8. [Emails Automatiques](#8-emails-automatiques)
9. [Mail Marketing](#9-mail-marketing)
10. [Paramètres](#10-paramètres)
11. [Documents PDF](#11-documents-pdf)
12. [Modèle de Données](#12-modèle-de-données)
13. [Stack Technique](#13-stack-technique)
14. [Phases de Livraison](#14-phases-de-livraison)
15. [Points de Configuration au Lancement](#15-points-de-configuration-au-lancement)

---

## 1. Contexte & Objectifs

### 1.1 Présentation de Jolof Stream

Jolof Stream est une entreprise individuelle sénégalaise spécialisée dans la captation et la diffusion en direct d'événements sur le web. Basée à Dakar, elle associe expertise technique et sensibilité multiculturelle pour offrir des productions de niveau international.

**Cofondateurs** : 2 — droits identiques sur toute la plateforme.  
**Domaine** : jolofstream.com (acheté sur LWS)  
**Déploiement** : Vercel d'abord, connexion domaine ensuite  
**URL principale** : jolofstream.com (sans www — redirection automatique)

### 1.2 Objectif de la plateforme

Remplacer la gestion informelle (fichiers épars, échanges WhatsApp, devis Google Docs) par une plateforme centralisée composée de :

- **Un site public** : vitrine, génération de leads, inscriptions formations
- **Un dashboard admin** : gestion complète de l'entreprise (CRM, finance, projets, formations, contrats, catalogue, mail marketing)

### 1.3 Trois objectifs à égalité pour le site public

1. Générer des demandes de devis / leads
2. Permettre l'inscription aux formations
3. Asseoir la crédibilité de l'agence (portfolio, témoignages, À propos)

---

## 2. Architecture Générale

### 2.1 Structure

```
jolofstream.com/           → Site public (accessible à tous)
jolofstream.com/admin      → Dashboard admin (authentification requise)
jolofstream.com/admin/login → Page de connexion
```

Un seul repository Next.js. Un seul déploiement Vercel. Une seule base de données Supabase.

### 2.2 Deux interfaces dans le même projet

| Interface | Accès | Audience |
|-----------|-------|----------|
| Site public | Public | Prospects, clients, visiteurs |
| Dashboard /admin | Privé — authentification | Les 2 cofondateurs uniquement |

---

## 3. Authentification & Sécurité

### 3.1 Connexion

- Page dédiée : `/admin/login`
- Identifiants : email + mot de passe
- Session persistante : 7 jours (token JWT)
- Les deux cofondateurs peuvent être connectés simultanément sans conflit
- Technologie : NextAuth.js

### 3.2 Réinitialisation du mot de passe

- Bouton "Mot de passe oublié" sur la page de connexion
- Email de réinitialisation envoyé automatiquement sur l'adresse du compte
- Lien valable 1 heure

### 3.3 Profil utilisateur

Chaque cofondateur gère son propre profil (voir section 10.7). Il ne peut pas modifier le profil de l'autre.

### 3.4 2FA

Prévu en V2 de la plateforme — hors scope Phase 1.

### 3.5 Protection des routes

Toutes les routes `/admin/*` sont protégées. Toute tentative d'accès sans session active redirige vers `/admin/login`.

---

## 4. Site Public

### 4.1 Pages

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Hero, services, portfolio, formations, témoignages, CTA |
| Services | `/services` | Détail de chaque offre avec forfaits |
| Formations | `/formations` | Sessions disponibles + formulaire d'inscription |
| Portfolio | `/portfolio` | Réalisations filtrables par type |
| À propos | `/a-propos` | Histoire, équipe, mission, valeurs, chiffres clés |
| Contact | `/contact` | Formulaire de devis + FAQ + coordonnées |
| Mentions légales | `/mentions-legales` | Générées depuis les Paramètres |
| CGV | `/cgv` | Éditables depuis le dashboard |

### 4.2 Navigation

Menu principal : Accueil · Services · Formations · Portfolio · À propos · Contact  
CTA fixe dans la navbar : "Demander un devis"  
Footer : liens rapides, réseaux sociaux, mentions légales, CGV

### 4.3 Page Accueil

- Hero sombre avec slogan, description, double CTA (devis + formations)
- Badge "Disponible pour vos événements 2026" avec dot animé
- Bande rouge avec les 4 familles de services
- Section "Qui sommes-nous" avec stats
- Grille des 3 services phares
- Aperçu portfolio (5 réalisations)
- 2 prochaines formations avec jauge de places
- Section témoignages clients
- CTA final

### 4.4 Page Services

Pour chaque service : description, ce qui est inclus, processus en étapes numérotées, CTA.

**Services présentés :**
- Captation & Streaming Live (Pack Standard + Pack Premium)
- CEO Content Package (Forfait Essentiel + Forfait Premium)
- Creator Weekend (Weekend Solo + Weekend Collab)
- Gestion publication réseaux (option add-on)

Les forfaits CEO Package et Creator Weekend affichent les prix et le contenu définis dans le **Catalogue du dashboard** — toute modification admin se répercute en temps réel.

### 4.5 Page Formations

- Liste des sessions ouvertes avec : titre, date, lieu, durée, places restantes, tarif, jauge de remplissage
- Badge "Complet" si session pleine
- Badge "Bientôt complet" si moins de 20% de places restantes
- Bouton "S'inscrire" → ancre vers le formulaire d'inscription en bas de page
- Formulaire d'inscription : prénom, nom, email, téléphone, session choisie, message optionnel
- Encadré informatif : "Aucun paiement sur ce site. Vous recevrez un email avec le lien Wave Business."
- Si session complète : formulaire liste d'attente

### 4.6 Page Portfolio

- Grille de réalisations (3 colonnes, décalée)
- Filtres : Tout / Streaming Live / CEO Content / Creator Weekend / Formations
- Chaque carte : miniature (photo ou miniature YouTube 1280x720px), type, titre, description courte
- Clic sur une carte avec lien YouTube → ouvre YouTube dans un nouvel onglet
- Contenu géré entièrement depuis le dashboard (module Portfolio)

### 4.7 Page À propos

Contenu entièrement contrôlable depuis **Paramètres → Contenu du site → Page À propos** :

- Histoire de l'agence (texte libre)
- Mission (texte libre)
- Valeurs (liste éditable : titre + description par valeur)
- Équipe (liste éditable : photo 400x400px, prénom, nom, rôle, description courte)
- Chiffres clés (liste éditable : chiffre + libellé)

### 4.8 Page Contact

- Formulaire de demande de devis : prénom, nom, email, téléphone, organisation, type de service, date souhaitée, lieu, description du projet
- Coordonnées directes (tirées des Paramètres)
- Réseaux sociaux
- FAQ dépliable (5 questions minimum)
- Soumission du formulaire → crée automatiquement un lead dans le CRM du dashboard + notification aux deux admins

### 4.9 SEO

- Balises meta title et description sur chaque page
- Open Graph tags (prévisualisation WhatsApp, Facebook, LinkedIn)
- Fichier `sitemap.xml` généré automatiquement
- Fichier `robots.txt` configuré
- Google Search Console à connecter au lancement
- Pas de Google Analytics en Phase 1

---

## 5. Dashboard Admin

### 5.1 Layout

- **Sidebar fixe sombre** (240px) : logo, profil utilisateur connecté, navigation par section
- **Topbar sticky claire** : titre de la section, fil d'Ariane, bouton d'action contextuel, bouton notifications
- **Zone de contenu claire** : fond crème/blanc, scrollable

### 5.2 Accès

- 2 comptes admin — droits strictement identiques
- Connexion simultanée possible sans conflit
- Avatar et nom affichés dans la sidebar (tirés du profil)

### 5.3 Menu de navigation

```
Principal
  ├── Vue d'ensemble
  ├── Projets
  └── Clients & CRM

Finance
  ├── Devis & Factures
  └── Comptabilité

Services
  ├── Formations
  ├── Catalogue offres
  └── Portfolio

Documents
  └── Contrats

Communication
  └── Mail Marketing

Équipe
  └── Journal d'activité

─────────────
  Paramètres
  Déconnexion
```

### 5.4 Vue d'ensemble (Dashboard Home)

KPIs en temps réel :
- CA du mois en cours
- Nombre de projets en cours
- Factures impayées (nombre + montant total)
- Inscriptions formations en attente de paiement

Graphique CA mensuel (barres, année en cours)

Widgets :
- Derniers leads entrants (3 derniers)
- Tâches du jour
- Prochains événements (3 prochains)
- Activité récente

---

## 6. Modules du Dashboard

### 6.1 Module Projets

**Fiche projet :**
- Titre, client (lié au CRM), type (Streaming Live / CEO Package / Creator Weekend / Formation / Autre)
- Statut : Prospect → Devis envoyé → Confirmé → En cours → Livré → Archivé → Perdu
- Date, lieu, budget estimé
- Checklist technique personnalisable (équipements, intervenants, notes)
- Dépenses attachées au projet (pour calcul de rentabilité)
- Documents liés : contrat, devis, facture, briefs, livrables
- Notes internes collaboratives

**Vue liste :**
- Tableau avec filtres par statut et type
- Recherche par nom de projet ou client
- Tri par date, statut, budget

**Calcul automatique :**
- Rentabilité par projet = revenus projet - dépenses projet

**Règle importante :**
Les projets à statut "Perdu" sont conservés dans l'historique avec une note de raison. Jamais supprimés.

### 6.2 Module CRM Clients

**Fiche client :**
- Nom, prénom / raison sociale
- Type : Entreprise / Particulier / Créateur / Association
- Email, téléphone
- Canal d'acquisition : Site web / Instagram / Facebook / Référence / WhatsApp / Autre
- Statut : Prospect / Actif / Inactif / VIP
- Case à cocher **"Exonéré de TVA"** — se répercute automatiquement sur tous les documents générés pour ce client
- Notes internes
- Tags libres

**Historique par client :**
- Tous les projets associés
- Tous les devis et factures
- Toutes les interactions (notes chronologiques)

**Leads entrants :**
- Tout formulaire soumis sur le site public crée automatiquement une fiche lead dans le CRM
- Notification immédiate aux deux admins (dashboard + email)
- Statut lead : Nouveau → En cours → Gagné → Perdu (avec note de raison)

**Listes de diffusion mail marketing :**
- Chaque client peut être assigné à une ou plusieurs listes (voir section 9)

### 6.3 Module Devis & Factures

#### 6.3.1 Nomenclature

```
Devis   : DEV-AAAA-JS-XXX   (ex: DEV-2026-JS-001)
Facture : FAC-AAAA-JS-XXX   (ex: FAC-2026-JS-001)
```
Le compteur repart à 001 chaque année automatiquement.

#### 6.3.2 Création d'un devis

**Étape 1 — Choisir un template (optionnel) :**

| Template | Lignes pré-remplies |
|----------|---------------------|
| Captation Live Standard | Captation multi-caméras, régie, diffusion, enregistrement, support |
| Captation Live Premium | Idem + habillage graphique, caméras supplémentaires |
| CEO Content Essentiel | Session 2h, montage 3 vidéos, livraison Drive |
| CEO Content Premium | 2 sessions/mois, 8 vidéos, publication incluse |
| Creator Weekend Solo | 2 jours, montage 10-15 vidéos |
| Creator Weekend Collab | 2 jours, 3 créateurs, montage 20-30 vidéos |
| Devis personnalisé | Page blanche |

Les templates sont liés au catalogue — modification du prix dans le catalogue = mise à jour dans les futurs devis.

**Étape 2 — Remplir le devis :**
- Référence auto (non modifiable)
- Client (sélection depuis le CRM ou création à la volée)
- Objet
- Lignes de prestation : description, quantité, prix unitaire, total ligne
- Ajout / suppression de lignes librement

**Étape 3 — Taxes :**
- Case **BRS 5%** : cochée par défaut sur tous les devis
- Case **TVA 18%** : cochée par défaut, décochable manuellement
- Si le client est marqué "Exonéré de TVA" dans le CRM → TVA décochée automatiquement à l'ouverture
- Mention légale d'exonération ajoutée automatiquement sur le document si TVA décochée

**Calcul :**
```
Sous-total HT
+ BRS 5% (si coché)
+ TVA 18% (si coché)
= Total TTC
```

**Étape 4 — Preview temps réel :**
Interface en deux colonnes : formulaire à gauche, aperçu PDF à droite mis à jour en direct.

**Statuts devis :** Brouillon → Envoyé → Accepté → Refusé  
Les devis refusés sont conservés dans l'historique. Jamais supprimés.

#### 6.3.3 Modification d'un devis

- Modifiable librement tant qu'il est en statut Brouillon ou Envoyé
- Si le client signale une exonération de TVA après envoi : aller sur sa fiche CRM → cocher "Exonéré TVA" → retourner sur le devis → bouton "Recalculer" → renvoyer
- Numéro de devis conservé après modification

#### 6.3.4 Conversion devis → facture

- Bouton "Convertir en facture" sur un devis Accepté
- Deux options :
  - **Facturation en une fois** : une seule facture pour le montant TTC total
  - **Avec acompte** : saisir le pourcentage (ou montant fixe) → génération automatique de deux factures

**Logique acompte (exemple 30%) :**
```
Total TTC              615 000 F
Facture acompte (30%)  184 500 F  → FAC-2026-JS-010
Facture solde (70%)    430 500 F  → FAC-2026-JS-011
  (avec ligne "Acompte versé : -184 500 F")
```
BRS et TVA calculés une seule fois sur le total HT. Répartis proportionnellement.

#### 6.3.5 Statuts facture

Émise → Payée / Partiellement payée / Annulée

Les factures annulées restent dans l'historique avec mention "Annulée". Si une facture émise et envoyée doit être corrigée → émettre un avoir (FAC-2026-JS-XXX-AVOIR).

#### 6.3.6 Relances automatiques

Délai paramétrable dans **Paramètres → Devis & Factures**. Email de relance envoyé automatiquement X jours après l'échéance si la facture est impayée.

### 6.4 Module Comptabilité

**Vue mensuelle et annuelle :**
- Recettes totales (par source : Captation / CEO Package / Creator Weekend / Formations)
- Dépenses totales (par catégorie)
- Bénéfice net
- Marge (%)
- Comparaison mois par mois
- Objectif annuel avec progression

**Catégories de dépenses :**
Équipement · Transport · Sous-traitance · Charges fixes · Marketing · Divers

**Saisie d'une dépense :**
- Catégorie, montant, date, description
- Projet associé (optionnel) → pour calcul de rentabilité par projet

**Exports :**
- Export Excel (données brutes)
- Export PDF (rapport mis en page)

**Alertes :**
- Factures impayées au-delà du délai défini dans les Paramètres

### 6.5 Module Formations

**Création d'une session :**
- Titre, date(s), lieu, nombre de places max, tarif, description, statut (Ouvert / Complet / Annulé)

**Gestion des inscrits :**
- Liste : nom, email, téléphone, statut paiement (En attente / Confirmé / Annulé)
- Bouton "Confirmer le paiement" par inscrit → déclenche l'email de confirmation
- Gestion liste d'attente : si session complète, les nouveaux inscrits vont en liste d'attente automatiquement
- Si un inscrit se désinscrit → le premier de la liste d'attente est notifié automatiquement

**Historique :**
- Toutes les sessions passées avec revenus générés par session

**Lien avec le site public :**
- Toute session créée dans le dashboard apparaît automatiquement sur la page Formations du site
- Badge "Complet" affiché automatiquement quand toutes les places sont prises

### 6.6 Module Catalogue Offres

Gestion des offres publiées sur le site public.

**CEO Content Package — 2 forfaits éditables :**

| Champ | Type |
|-------|------|
| Nom du forfait | Texte libre |
| Prix (FCFA) | Nombre |
| Période (session / mois) | Sélecteur |
| Lignes incluses | Liste éditable (ajout/suppression/modification) |
| Statut | Toggle Publié / Non publié |

**Creator Weekend — 2 forfaits éditables :** même structure.

**Bibliothèque de prestations :**
- Prix de référence par type de prestation
- Utilisés pour pré-remplir les templates de devis
- Modification ici → mise à jour dans tous les futurs devis utilisant ce template

Toute modification du catalogue se répercute immédiatement sur le site public.

### 6.7 Module Portfolio

**Ajout d'une réalisation :**
- Titre
- Type : Streaming Live / CEO Content / Creator Weekend / Formation
- Date
- Description courte
- Média : soit upload photo (JPG/PNG · 1280x720px recommandé · max 5MB), soit lien YouTube (miniature extraite automatiquement en 1280x720px)
- Clic sur miniature YouTube → ouvre YouTube dans un nouvel onglet
- Statut : toggle Publié / Non publié

**Gestion :**
- Modifier / supprimer une réalisation
- Réorganiser l'ordre d'affichage par drag & drop
- Seules les réalisations publiées apparaissent sur le site

**Stockage photos :** Supabase Storage

### 6.8 Module Contrats

**Bibliothèque de modèles :**
- Contrat de prestation de services
- Contrat CEO Content Package (forfaits récurrents)
- Contrat de formation
- Accord de confidentialité (NDA)

**Génération d'un contrat :**
- Choisir un modèle → sélectionner un projet → le contrat se pré-remplit avec les infos du projet et du client
- Export PDF

**Statuts :** À envoyer → Signé → Archivé

**Stockage :** Upload des documents signés sur Supabase Storage, liés à la fiche projet et client.

### 6.9 Module Journal d'Activité

**Log horodaté** de toutes les actions des deux cofondateurs :
- Qui a fait quoi, à quelle heure
- Affiché avec avatar + nom + couleur distincte par cofondateur

**Actions loguées (liste non exhaustive) :**
- Création / modification / envoi de devis
- Émission / paiement / annulation de facture
- Création / modification de projet
- Confirmation de paiement formation
- Nouveau lead entrant
- Modification du catalogue
- Envoi de campagne mail marketing

**Notifications temps réel :**
Cloche dans la topbar avec badge nombre. Notifications pour :
- Nouveau lead entrant (depuis le site)
- Nouvelle inscription formation
- Paiement formation confirmé
- Facture impayée dépassant l'échéance

**Tâches partagées :**
- To-do list commune aux deux cofondateurs
- Ajout, complétion, assignation à l'un ou l'autre
- Affiché sur la vue d'ensemble

**Calendrier partagé :**
- Vue mensuelle : projets + sessions de formation

---

## 7. Flux Paiement Formations

Aucun paiement en ligne direct sur la plateforme. Tout passe par Wave Business.

```
1. Le candidat remplit le formulaire d'inscription sur le site
       ↓
2. Email automatique envoyé au candidat
   → Contenu : confirmation de réception, nom session, montant,
     lien Wave Business, délai pour payer (48h)
       ↓
3. Le candidat clique sur le lien Wave Business
   → Paiement effectué depuis son téléphone
       ↓
4. L'admin voit l'inscription en statut "En attente" dans le dashboard
   → Il vérifie la réception du paiement
   → Il clique "Confirmer le paiement"
       ↓
5. Email de confirmation envoyé au candidat
   → Place réservée, date, lieu, infos pratiques
```

**Si la session est complète au moment de l'inscription :**
```
1. Inscription reçue → statut "Liste d'attente"
2. Email automatique : position en file d'attente
3. Si un inscrit se désinscrit → email automatique au premier de la liste
```

**Lien Wave Business :**
La formule du lien dynamique (avec montant par session) est configurée dans **Paramètres → Paiement & Wave Business**.

---

## 8. Emails Automatiques

Tous les modèles sont éditables depuis **Paramètres → Emails automatiques**.  
Variables dynamiques disponibles : `{prenom}`, `{nom}`, `{montant}`, `{nom_session}`, `{date_session}`, `{lieu_session}`, `{lien_wave}`, `{nom_client}`, `{ref_devis}`, `{ref_facture}`, `{date_echeance}`.

### 8.1 Emails côté formations

| Email | Déclencheur | Destinataire |
|-------|-------------|--------------|
| Inscription reçue | Soumission formulaire | Candidat |
| Paiement confirmé | Admin clique "Confirmer" | Candidat |
| Liste d'attente | Session complète | Candidat |
| Place libérée | Désistement d'un inscrit | 1er de la liste d'attente |

### 8.2 Emails côté services

| Email | Déclencheur | Destinataire |
|-------|-------------|--------------|
| Accusé de réception demande | Formulaire contact soumis | Prospect |
| Devis envoyé | Admin envoie le devis | Client |
| Relance facture impayée | X jours après échéance | Client |

### 8.3 Notifications admins

Les deux cofondateurs reçoivent email + notification dashboard pour :
- Nouveau lead entrant depuis le site
- Nouvelle inscription formation
- Paiement formation confirmé

---

## 9. Mail Marketing

Module dédié dans le menu principal du dashboard.

### 9.1 Listes de contacts

| Liste | Source |
|-------|--------|
| Tous les contacts | Base complète automatique |
| Clients actifs | Clients avec projet ou facture |
| Prospects | Leads sans projet signé |
| Anciens clients | Inactifs depuis +6 mois |
| Inscrits formations | Ayant suivi au moins une formation |
| Créateurs de contenu | Tag manuel sur fiche client |
| Corporate / Entreprises | Type client = Entreprise |
| Abonnés newsletter | Inscrits via le site public |

**Import CSV :** possible pour ajouter des contacts externes avec attribution à une ou plusieurs listes.

**Un contact peut appartenir à plusieurs listes simultanément.**

### 9.2 Modèles de campagnes

| Modèle | Usage |
|--------|-------|
| Newsletter générale | Actualités de l'agence, nouveautés |
| Promo formation | Annonce session avec lien d'inscription |
| Relance prospect | Suivi d'une demande sans réponse |
| Fin d'année | Vœux décembre |
| Tabaski | Message de fête |
| Korité | Message de fête |
| Noël | Message de vœux |
| Campagne personnalisée | Page blanche |

Chaque modèle est éditable : texte, objet, liste destinataire.

### 9.3 Création et envoi d'une campagne

1. Choisir un modèle
2. Éditer l'objet et le corps de l'email (éditeur simple)
3. Choisir la liste destinataire (ou plusieurs)
4. Prévisualiser
5. Envoyer immédiatement ou programmer une date/heure

### 9.4 Statistiques

Phase 1 : envoi uniquement, pas de stats.  
Phase 2 : taux d'ouverture, taux de clic, désinscriptions.

### 9.5 Désinscription

Lien de désinscription inclus automatiquement dans chaque email envoyé. Un contact désinscrit est marqué comme tel dans le CRM et exclu des futurs envois.

### 9.6 Technologie

Envoi via **Resend** — déjà dans la stack.

---

## 10. Paramètres

Section accessible depuis le bas de la sidebar. 7 sous-sections.

### 10.1 Informations de l'agence

| Champ | Notes |
|-------|-------|
| Raison sociale | Ex : Jolof Stream |
| Forme juridique | Entreprise individuelle (modifiable) |
| NINEA | À renseigner au développement |
| Numéro RC | À renseigner au développement |
| Adresse du siège | — |
| Email officiel | — |
| Téléphone officiel | — |
| Logo | Upload PNG/SVG — apparaît sur les PDF et le site |
| Signature / tampon | Upload image — apparaît sur les PDF |

Ces infos alimentent : les devis, factures, contrats, mentions légales, footer du site.

### 10.2 Mon profil

Chaque cofondateur gère son propre profil :

| Champ | Notes |
|-------|-------|
| Prénom, Nom | — |
| Email de connexion | Utilisé pour se connecter |
| Téléphone | — |
| Rôle / titre | Libre (ex : Cofondateur, Directeur technique) |
| Photo avatar | Upload JPG/PNG · 400x400px recommandé |
| Changement de mot de passe | Ancien mot de passe requis |

L'avatar s'affiche dans la sidebar et dans le journal d'activité.

### 10.3 Contenu du site

**Général :**
- Slogan hero (texte affiché dans le hero de l'accueil)
- Description courte (footer + meta description)
- Coordonnées de contact (répercutées partout sur le site)
- Chiffres clés (liste éditable : chiffre + libellé)
- Réseaux sociaux (liens)

**Page À propos — contrôle total :**
- Histoire (éditeur texte)
- Mission (éditeur texte)
- Valeurs (liste : titre + description par valeur — ajout/suppression/réorganisation)
- Membres de l'équipe (liste : photo 400x400px + prénom + nom + rôle + description — ajout/suppression/réorganisation par drag & drop)
- Chiffres clés (liste : chiffre + libellé — ajout/suppression)

### 10.4 Documents légaux

- **Mentions légales** : éditeur texte (données agence injectées automatiquement)
- **CGV** : éditeur texte riche (contenu à valider juridiquement)

Les deux pages sont visibles sur le site public depuis le footer.

### 10.5 Devis & Factures

| Paramètre | Valeur par défaut |
|-----------|-------------------|
| Numéro de départ du compteur | 001 |
| Délai de validité des devis | 30 jours |
| Délai de paiement des factures | 15 jours |
| Délai avant relance automatique | 7 jours après échéance |
| Pied de page personnalisable des PDF | Texte libre |
| BRS coché par défaut | Oui (modifiable) |
| TVA cochée par défaut | Oui (modifiable) |

### 10.6 Paiement & Wave Business

- Numéro Wave Business
- Formule du lien de paiement dynamique par session (format à renseigner selon la doc Wave Business)
- Note : le lien est inséré automatiquement dans les emails de paiement formation via la variable `{lien_wave}`

### 10.7 Emails automatiques

Éditeur pour chaque modèle d'email (voir section 8).  
Variables dynamiques disponibles dans chaque champ.  
Prévisualisation avant sauvegarde.

---

## 11. Documents PDF

### 11.1 Structure d'un devis / facture

```
EN-TÊTE
├── Logo Jolof Stream (depuis Paramètres)
├── Nom, forme juridique, NINEA, RC, adresse, email, téléphone
└── Référence document + Date d'émission + Date d'échéance

DESTINATAIRE
└── Nom client, organisation, adresse, email, téléphone

CORPS
└── Tableau prestations : Description | Quantité | Prix unitaire | Total ligne

TOTAUX
├── Sous-total HT
├── BRS 5% (si applicable)
├── TVA 18% (si applicable, ou mention exonération)
└── Total TTC (mis en évidence)

PIED DE PAGE
├── Modes de paiement : Wave Business, virement bancaire
├── Coordonnées de contact
└── Texte personnalisable (depuis Paramètres)

SIGNATURE
└── Signature / tampon (depuis Paramètres)
```

### 11.2 Identité visuelle

Couleurs Jolof Stream (rouge #C8151B, jaune #F5B800) appliquées sur l'en-tête et les éléments de mise en page.

### 11.3 Technologie

Génération via **React-PDF** ou **PDFKit** côté serveur.

---

## 12. Modèle de Données

### 12.1 Tables principales

```sql
-- Utilisateurs admin
users
  id, email, password_hash, first_name, last_name,
  role, avatar_url, created_at, updated_at

-- Clients
clients
  id, type (entreprise|particulier|créateur|association),
  name, email, phone, organization, acquisition_channel,
  status (prospect|actif|inactif|vip),
  tva_exempt (boolean, default false),
  notes, tags, created_at, updated_at

-- Projets
projects
  id, client_id, title, type, status, date,
  location, budget_estimate, notes,
  created_by, created_at, updated_at

-- Devis
quotes
  id, reference (DEV-AAAA-JS-XXX), client_id, project_id,
  subject, status (brouillon|envoyé|accepté|refusé),
  brs_enabled (boolean), tva_enabled (boolean),
  subtotal_ht, brs_amount, tva_amount, total_ttc,
  valid_until, notes, created_by, created_at, updated_at

-- Lignes de devis
quote_lines
  id, quote_id, description, quantity, unit_price, total

-- Factures
invoices
  id, reference (FAC-AAAA-JS-XXX), client_id, project_id, quote_id,
  type (standard|acompte|solde|avoir),
  status (émise|payée|partiellement_payée|annulée),
  subtotal_ht, brs_amount, tva_amount, total_ttc,
  issued_at, due_at, paid_at, notes, created_by, created_at, updated_at

-- Lignes de facture
invoice_lines
  id, invoice_id, description, quantity, unit_price, total

-- Dépenses
expenses
  id, category, amount, date, description,
  project_id (nullable), created_by, created_at

-- Sessions de formation
training_sessions
  id, title, date_start, date_end, location,
  max_seats, price, description,
  status (ouvert|complet|annulé), created_at, updated_at

-- Inscriptions
training_registrations
  id, session_id, first_name, last_name, email, phone,
  status (en_attente|confirmé|annulé|liste_attente),
  waitlist_position (nullable), message,
  registered_at, confirmed_at

-- Réalisations portfolio
portfolio_items
  id, title, type, date, description,
  media_type (photo|youtube), media_url,
  published (boolean), display_order, created_at, updated_at

-- Contrats
contracts
  id, project_id, client_id, template_type,
  status (à_envoyer|signé|archivé),
  file_url, signed_at, created_by, created_at, updated_at

-- Journal d'activité
activity_logs
  id, user_id, action, entity_type, entity_id,
  description, created_at

-- Tâches
tasks
  id, title, due_date, completed (boolean),
  assigned_to (user_id nullable), created_by, created_at, updated_at

-- Contacts mail marketing
marketing_contacts
  id, client_id (nullable), email, first_name, last_name,
  lists (array), unsubscribed (boolean), created_at

-- Campagnes mail marketing
marketing_campaigns
  id, title, template_type, subject, body,
  lists (array), status (brouillon|envoyé|programmé),
  scheduled_at, sent_at, created_by, created_at

-- Paramètres (clé-valeur)
settings
  key, value, updated_by, updated_at
```

---

## 13. Stack Technique

### 13.1 Frontend

| Technologie | Usage |
|-------------|-------|
| Next.js 14 (App Router) | Framework full-stack — site public + dashboard |
| TypeScript | Typage statique |
| Tailwind CSS | Styles |
| Shadcn/UI | Composants dashboard |
| Framer Motion | Animations site public |
| React Hook Form | Formulaires |
| Recharts | Graphiques dashboard |
| React-PDF | Preview et génération PDF devis/factures |

### 13.2 Backend

| Technologie | Usage |
|-------------|-------|
| Next.js API Routes | Endpoints API |
| Prisma ORM | Accès base de données |
| Supabase (PostgreSQL) | Base de données + stockage fichiers |
| NextAuth.js | Authentification (session 7 jours) |
| Resend | Envoi emails automatiques + mail marketing |
| Sharp | Optimisation images |

### 13.3 Infrastructure

| Service | Usage |
|---------|-------|
| Vercel | Hébergement + déploiement continu |
| Supabase Storage | Stockage photos portfolio, avatars, documents signés |
| jolofstream.com (LWS) | Domaine — connexion après déploiement Vercel |

---

## 14. Phases de Livraison

### Phase 1 — MVP (Priorité absolue)

**Site public :**
- 6 pages (Accueil, Services, Formations, Portfolio, À propos, Contact)
- Mentions légales + CGV
- SEO de base (meta, sitemap, robots.txt, Open Graph)
- Formulaire contact → lead CRM
- Formulaire inscription formation → flux Wave Business

**Dashboard :**
- Authentification (2 comptes, session 7 jours, reset mot de passe)
- Vue d'ensemble avec KPIs
- Module Projets
- Module CRM Clients (avec exonération TVA)
- Module Devis & Factures (avec BRS/TVA, nomenclature, preview temps réel, templates, acomptes)
- Module Formations (inscriptions + confirmation paiement Wave)
- Module Catalogue Offres (forfaits éditables)
- Module Portfolio (gestion réalisations)
- Module Paramètres (toutes les sections)
- Emails automatiques (7 modèles)
- Journal d'activité + notifications
- Tâches partagées

### Phase 2 — Finance complète

- Module Comptabilité (recettes/dépenses, export Excel/PDF, alertes)
- Rentabilité par projet
- Relances automatiques factures impayées
- Module Mail Marketing (envoi campagnes, listes, modèles fêtes)

### Phase 3 — Documents & Contrats

- Module Contrats (modèles, génération, stockage)
- Calendrier partagé complet
- Statistiques mail marketing (taux ouverture, clics)

### Phase 4 — Optimisations & V2

- 2FA (double authentification)
- Analytics site public (Google Analytics ou Plausible)
- Formation sur mesure entreprise (quand le concept sera défini)
- Optimisations SEO avancées (blog, contenu organique)
- Automatisations avancées

---

## 15. Points de Configuration au Lancement

Avant la mise en ligne, les éléments suivants doivent être renseignés dans **Paramètres** :

| Élément | Statut |
|---------|--------|
| Logo Jolof Stream (PNG/SVG) | À fournir |
| NINEA | À renseigner |
| Numéro RC | À renseigner |
| Adresse officielle | À renseigner |
| Emails des deux cofondateurs | À renseigner |
| Numéro Wave Business | À fournir |
| Formule lien Wave dynamique | À fournir |
| Photo avatar Cofondateur A | À uploader |
| Photo avatar Cofondateur B | À uploader |
| Texte Histoire (page À propos) | À rédiger |
| Photos équipe (400x400px) | À fournir |
| Photos portfolio initiales (1280x720px) | À fournir |
| Contenu CGV | À valider juridiquement |
| Réseaux sociaux (liens) | À renseigner |

---

*Cahier des charges Jolof Stream — V1.0 — Mai 2026*  
*Document confidentiel — Usage interne*
