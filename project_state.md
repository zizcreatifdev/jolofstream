# État du projet — Jolof Stream

## Prompt en cours
Prompt 14 — SEO + preparation deploiement Vercel (TERMINÉ côté code)

## Ce qui est fait
- [x] Prompts 00 à 13 terminés
- [x] app/layout.tsx : metadata globale complete (metadataBase, title template "%s | Jolof Stream", keywords, authors, openGraph fr_SN, twitter summary_large_image, robots avec googleBot directives)
- [x] Metadata par page sur les 7 pages publiques (Accueil herite, Services/Formations/Portfolio/A propos/Contact avec descriptions optimisees, CGV/Mentions noindex)
- [x] app/sitemap.ts : sitemap dynamique 6 URLs publiques (priorites 1.0 a 0.7)
- [x] app/robots.ts : Allow / sauf /admin et /api, reference sitemap.xml
- [x] public/og-image.png : copie du logo couleur (a remplacer par 1200x630px avant lancement)
- [x] public/og-image-placeholder.txt : note pour remplacement
- [x] NEXT_PUBLIC_SITE_URL ajoute dans .env.local
- [x] .env.vercel.example cree (template variables Vercel)
- [x] next.config.js : YouTube + i.ytimg remotePatterns + headers securite (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy)
- [x] vercel.json cree (buildCommand prisma generate + npm run build)
- [x] package.json : script postinstall = prisma generate
- [x] README.md complet (stack, dev local, deploiement Vercel, comptes seed, structure, doc interne)
- [x] decisions.md : D-041 (SEO metadataBase + OG), D-042 (Vercel buildCommand + headers + postinstall)
- [x] npm run build OK — 66 routes (sitemap.xml + robots.txt ajoutees)

## Routes statiques nouvelles
- `/sitemap.xml` (statique, regenere a chaque build)
- `/robots.txt` (statique)

## Bloqueurs réseau (inchangés)
Supabase + Resend host_not_allowed depuis le conteneur. Sans impact sur le SEO statique ou la prep Vercel.

## Checklist avant lancement
- [ ] Migration DB depuis machine locale : `npx prisma db push`
- [ ] Seed DB : `npx prisma db seed` (2 admins + 4 offres catalogue + 30+ parametres defaults)
- [ ] Configurer les variables d'environnement sur Vercel (cf. .env.vercel.example)
- [ ] Generer un NEXTAUTH_SECRET de production : `openssl rand -base64 32`
- [ ] Connecter le domaine `jolofstream.com` (LWS) a Vercel
- [ ] Mettre a jour `NEXTAUTH_URL` et `NEXT_PUBLIC_SITE_URL` apres connexion domaine
- [ ] Verifier le domaine `notifications@jolofstream.com` sur Resend (DNS DKIM/SPF/DMARC)
- [ ] Mettre a jour `EMAIL_FROM="Jolof Stream <notifications@jolofstream.com>"` sur Vercel
- [ ] Renseigner les Parametres dans le dashboard `/admin/parametres` :
  - Entreprise : NINEA, RC, adresse, Wave Business, lien Wave dynamique
  - Reseaux sociaux : 5 URLs
  - Documents PDF : footer text, signature URL
  - Contenu site : Histoire, Mission, 4 Valeurs, 2 membres equipe (photos), 4 stats, 3+ temoignages
  - CGV (validation juridique requise)
  - Mentions legales
  - Notifications : admin1_email, admin2_email
- [ ] Changer les mots de passe des 2 comptes admin dans Mon profil
- [ ] Remplacer `public/og-image.png` par une vraie image 1200x630px aux couleurs Jolof Stream
- [ ] Photos portfolio initiales (1280x720px) a uploader via le dashboard
- [ ] Connecter Google Search Console et soumettre le sitemap
- [ ] Tester tous les formulaires en production (/contact, /formations, /admin)

## Ce qui reste (Phase 1)
- [ ] Prompt 15 — Tests, build final, deploiement Vercel

## Problèmes signalés / décisions prises (Prompt 14)
- D-041 : metadataBase utilise NEXT_PUBLIC_SITE_URL avec fallback https://jolofstream.com. Indispensable pour Next.js 14 (sinon avertissement au build sur les OG absolute URLs).
- D-042 : buildCommand Vercel = `npx prisma generate && npm run build`. Si prisma generate echoue (env DATABASE_URL manquante), le build casse - c'est OK, on veut un fail rapide. postinstall en backup pour npm install local.
- Image OG : impossible de generer une PNG 1200x630 depuis Claude Code (pas d'outil image). Copie du logo couleur en attendant. A remplacer manuellement (Figma, Canva, ou Bannerbear) avant le lancement public.
- CGV et Mentions legales en `robots: { index: false, follow: false }` : ces pages ne necessitent pas d'indexation Google et evitent du contenu dupliquable inutile.
- Headers securite : DENY (pas SAMEORIGIN) pour X-Frame-Options - le site n'a pas besoin d'etre embarque en iframe. Si necessite future (widget de devis), passer en SAMEORIGIN.

## Prochaine étape
Prompt 15 — Tests, build final, deploiement Vercel.
