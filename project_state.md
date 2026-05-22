# État du projet — Jolof Stream

## Prompt en cours
Prompt 12 — Emails automatiques Resend (TERMINÉ côté code, DB toujours non migrée, envoi reel testable sur Vercel)

## Ce qui est fait
- [x] Prompts 00 à 11 terminés
- [x] lib/email.ts : client Resend + sendEmail helper avec try/catch interne
- [x] 7 templates React Email (+ layout commun emails/_layout.tsx) :
  - emails/_layout.tsx : EmailLayout reutilisable (header rouge, body, footer contact)
  - emails/confirmation-inscription-formation.tsx (Email 1)
  - emails/confirmation-paiement-formation.tsx (Email 2)
  - emails/liste-attente-promue.tsx (Email 3)
  - emails/nouveau-lead.tsx (Email 4)
  - emails/devis-envoye.tsx (Email 5)
  - emails/facture-emise.tsx (Email 6)
  - emails/relance-facture.tsx (Email 7)
- [x] /api/formations/inscription branche Email 1 (confirmation + waveLink depuis Parametres si configure)
- [x] /api/formations/inscriptions/[id] branche Email 2 (confirmer) + Email 3 (promotion liste d'attente)
- [x] /api/contact/devis branche Email 4 (envoi aux admin1_email + admin2_email)
- [x] /api/devis/[id]/envoyer (POST) cree : Email 5 + passage statut brouillon -> envoye + ActivityLog
- [x] /api/devis/[id]/convertir branche Email 6 (facture issue de conversion)
- [x] /api/factures (POST direct) branche Email 6
- [x] /api/factures/relances (POST) cree : Email 7 + ActivityLog avec daysPastDue
- [x] document-detail.tsx : bouton "Envoyer par email" (devis brouillon/envoye) + "Envoyer une relance" (facture emise/partiellement_payee)
- [x] decisions.md : D-035 (FROM Resend), D-036 (echec non bloquant), D-037 (envoi devis manuel), D-038 (relance manuelle Phase 1)
- [x] npm run build OK — 56 routes (2 nouvelles API : /api/devis/[id]/envoyer + /api/factures/relances)

## Routes API actives (nouvelles ce prompt)
- `POST /api/devis/[id]/envoyer` (auth, passe brouillon->envoye + Email 5)
- `POST /api/factures/relances` (auth, Email 7, body {invoiceId})

## Emails branches (recap)
| Email | Trigger | Route |
| --- | --- | --- |
| 1. Inscription enregistree | POST inscription publique | /api/formations/inscription |
| 2. Paiement confirme | PATCH action=confirmer | /api/formations/inscriptions/[id] |
| 3. Place liberee | PATCH action=annuler avec promotion | /api/formations/inscriptions/[id] |
| 4. Nouveau lead | POST contact public | /api/contact/devis |
| 5. Devis envoye | POST envoyer (bouton admin) | /api/devis/[id]/envoyer |
| 6. Facture emise | POST factures + POST convertir | /api/factures + /api/devis/[id]/convertir |
| 7. Relance facture | POST relances (bouton admin) | /api/factures/relances |

## Bloqueurs réseau (inchangés)
Supabase + Resend host_not_allowed depuis le conteneur. Les routes fonctionnent, l'envoi reel passera sur Vercel apres deploiement et apres verification du domaine `notifications@jolofstream.com` sur Resend (ou utilisation de `onboarding@resend.dev` pour les tests).

## Variables d'environnement
- RESEND_API_KEY : deja configuree (Prompt 01)
- EMAIL_FROM (optionnelle) : override de l'expediteur. Par defaut `Jolof Stream <onboarding@resend.dev>`. A passer a `Jolof Stream <notifications@jolofstream.com>` une fois le domaine verifie.

## Actions à faire par l'utilisateur sur sa machine locale ou Vercel
```bash
git pull origin main && npm install
npx prisma db push && npx prisma db seed
# Configurer dans le dashboard Resend :
#  1. Verifier le domaine jolofstream.com (DNS DKIM/SPF)
#  2. Ajouter EMAIL_FROM="Jolof Stream <notifications@jolofstream.com>" dans .env.local et Vercel
# Tester /admin :
#  - Connexion admin
#  - Aller dans Parametres > Notifications -> renseigner admin1_email et admin2_email
#  - Submit formulaire site public /contact -> verifier email aux 2 admins
#  - Inscription formation -> verifier email candidat
#  - Confirmer paiement formation -> verifier email candidat
#  - Annuler une confirmee avec quelqu'un en liste d'attente -> verifier email promu
#  - Devis brouillon -> bouton "Envoyer par email" -> verifier email client
#  - Convertir devis accepte -> verifier email facture au client
#  - Facture emise -> bouton "Envoyer une relance" -> verifier email client
```

## Ce qui reste (Phase 1)
- [ ] Prompt 13 — Vue d'ensemble KPIs + Journal d'activité + Tâches
- [ ] Prompt 14 — SEO (sitemap, robots.txt, meta, Open Graph)
- [ ] Prompt 15 — Tests, build final, déploiement Vercel

## Ambiguïtés détectées dans le CDC
- Flux "Mot de passe oublie" (CDC §3.2) : non implemente dans ce prompt. Necessite une table de tokens de reset + page de reset + 2 emails (demande + lien). Reportee au Prompt 13 ou en hotfix.
- Relances automatiques d'impayes (CDC §6.3.6) : la relance est manuelle dans Phase 1 (bouton admin). L'automatisation (cron Vercel + delai configurable depuis Parametres invoice_alert_days) sera ajoutee Phase 2.
- Domaine d'envoi Resend : `notifications@jolofstream.com` non encore verifie. Fallback `onboarding@resend.dev` qui ne necessite pas de DNS mais affiche un from generique.

## Problèmes signalés / décisions prises (Prompt 12)
- D-035 : FROM via env EMAIL_FROM. Defaut sur l'adresse sandbox Resend (`onboarding@resend.dev`) pour eviter une erreur d'expediteur non verifie. A basculer une fois le domaine `jolofstream.com` verifie.
- D-036 : tous les envois dans try/catch. Une defaillance Resend (rate limit, domaine non verifie, reseau coupe) ne casse jamais l'action metier. Les warnings sont logges `console.warn` pour visibility.
- D-037 : bouton "Envoyer par email" sur la fiche devis. Visible uniquement pour statut brouillon (passe a envoye) ou envoye (renvoie). ActivityLog systematique.
- D-038 : relance facture = action manuelle Phase 1. Bouton visible sur fiches factures emise/partiellement_payee, hors avoir. Calcule daysPastDue serveur-side. Affiche dans l'email un message different si la facture vient d'arriver a echeance (0j) vs en retard.
- ActivityLog non cree dans /api/contact/devis (route publique, userId non nullable) : choix maintenu de Prompt 05. L'email aux admins joue le role de notification visible.
- Email layout : composant EmailLayout reutilisable (header rouge, footer contact). Les contact-email/phone sont passes en prop optionnelle (defauts hardcode car les emails ne peuvent pas fetch /api/parametres facilement depuis le render React Email). Ameliorable Phase 2 en passant les params depuis la route.

## Prochaine étape
Prompt 13 — Vue d'ensemble KPIs + Journal + Taches, après Go.
