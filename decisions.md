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
