# Décisions — Jolof Stream

Format : Décision | Raison | Date

---

D-001 | Stack : Next.js 14 + TypeScript + Supabase + Prisma + Vercel | Défini dans le CDC V1.0 | Mai 2026
D-002 | Auth : NextAuth.js, session JWT 7 jours, 2 comptes admin à droits égaux | Défini dans le CDC section 3 | Mai 2026
D-003 | Pas de paiement en ligne direct sur la plateforme — paiement via Wave Business hors site | Défini dans le CDC section 7 | Mai 2026
D-004 | PDF : génération via React-PDF ou PDFKit côté serveur | Défini dans le CDC section 11.3 | Mai 2026
D-005 | Emails : Resend pour les emails automatiques et le mail marketing | Défini dans le CDC section 13.2 | Mai 2026
D-006 | Nomenclature devis : DEV-AAAA-JS-XXX — Nomenclature factures : FAC-AAAA-JS-XXX | Défini dans le CDC section 12.1 | Mai 2026
D-007 | BRS 5% et TVA 18% optionnels par devis/facture — exonération TVA possible par client | Défini dans le CDC sections 6.3 et 6.4 | Mai 2026
D-008 | Site public en français uniquement (Phase 1) | CDC ne mentionne pas le wolof en Phase 1 | Mai 2026
D-009 | Phase 1 = MVP complet (site public 6 pages + dashboard tous modules sauf Comptabilité, Contrats, Mail Marketing) | Défini dans le CDC section 14 | Mai 2026
D-010 | Déploiement : Vercel d'abord, connexion domaine jolofstream.com (LWS) ensuite | Défini dans le CDC section 1.1 | Mai 2026
D-011 | PDF : React-PDF retenu (cohérent §13.1, preview temps réel exigée §6.3.2, meilleure intégration React) | Mai 2026
D-012 | Données entreprise manquantes (NINEA, RC, Wave, logo, photos, emails cofondateurs) : placeholders en dev, saisie dans Parametres avant lancement | Mai 2026
D-013 | Dashboard admin restructure en route groups Next.js : app/admin/(auth)/login et app/admin/(dashboard)/* | Empeche la boucle infinie de redirect quand le layout dashboard fait getServerSession sur /admin/login. Les URLs restent inchangees (route groups invisibles dans l'URL). | Mai 2026
D-014 | Topbar : bouton d'action contextuel emet un CustomEvent admin:primary-action plutot qu'un onClick vide | Respecte Regle 1 (aucun bouton sans action) tout en differant la logique a chaque module. Les pages de module ecouteront cet evenement aux Prompts 06+ | Mai 2026
D-015 | Fonts : system font stack (font-sans Tailwind) au lieu de Google Fonts | Registre Google Fonts inaccessible depuis le conteneur (host_not_allowed). Aucune dependance Google Fonts donc deploiement Vercel sans degradation. Si typographie custom souhaitee plus tard, ajouter localement via next/font/local | Mai 2026
D-016 | Icones reseaux sociaux : SVG inline (FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon dans components/public/social-icons.tsx) | Lucide-react 1.16 a retire toutes les icones de marques pour raisons legales. Pas de remplacement upstream simple. SVG inline minimaux ecrits a la main (paths publics simple-icons style) | Mai 2026
D-017 | Framer Motion 12 : ease "easeOut" annote en as const pour satisfaire le typage strict Variants.transition.ease | Sans as const, TypeScript elargit le type a string et refuse de l'assigner au type Easing. Solution canonique recommandee par Framer pour TS strict | Mai 2026
D-018 | Logos : 3 fichiers PNG dans public/logos/ avec noms exacts Logo_JolofStream_couleur.png / Logo_JolofStream_blancJaune.png / Logo_JolofStream_blanc.png. Composants Logo reutilisables (components/public/logo.tsx et components/admin/logo.tsx) avec fallback onError silencieux (display:none si fichier manquant) | Mai 2026
D-019 | CRM Clients : suppression physique autorisee (pas d'archivage). Clients avec historique : la suppression sera bloquee par les contraintes FK Prisma (projects, quotes, invoices, contracts, marketing_contacts), le message d'erreur dans la route DELETE explicite cette regle a l'utilisateur | Mai 2026
D-020 | Projets : suppression physique uniquement pour statut "prospect". Tous les autres statuts (confirme, en_cours, livre, archive, perdu) sont conserves historiquement (CDC regle metier - les projets Perdus restent avec note de raison, jamais supprimes) | Mai 2026
D-021 | Vue Kanban projets : sans drag-and-drop (hors scope Phase 1). Changement de statut via boutons fleches sur chaque carte et via Select dans la vue tableau. Kanban affiche uniquement les 4 statuts actifs (prospect, confirme, en_cours, livre), les statuts terminaux (livre, archive, perdu) restent visibles en vue tableau | Mai 2026
D-022 | Devis : suppression uniquement si statut brouillon. Devis acceptes/refuses conserves historiquement (CDC regle metier 6.3.2) | Mai 2026
D-023 | Factures : pas de suppression ni modification des lignes apres emission. PATCH limite au statut. Correction via avoir uniquement. Reference avoir : FAC-AAAA-JS-XXX-AVOIR (montants negatifs sur lignes et totaux) | Mai 2026
D-024 | React-PDF : composants PDFViewer et PDFDownloadLink isoles dans components/admin/documents/pdf-preview.tsx et pdf-download.tsx, importes via dynamic({ssr:false}) depuis les consommateurs. Le PdfTemplate (Document/Page/Text/View) reste universel et peut etre importe partout | Mai 2026
D-025 | Compteur sequentiel devis/factures : count() dans une transaction Prisma au moment de la creation. Format AAAA reset chaque annee automatiquement (count() filtre sur startsWith DEV-AAAA-JS- / FAC-AAAA-JS-) | Mai 2026
