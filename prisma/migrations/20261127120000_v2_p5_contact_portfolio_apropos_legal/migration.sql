-- Refonte V2, prompt 5 : contact en 3 etapes, demandes de devis, portfolio,
-- a propos, pages legales, retrait de la liste newsletter.
-- Migration additive et idempotente : executable plusieurs fois dans
-- l'editeur SQL Supabase. Aucun contenu deja redige n'est ecrase.

-- 1. Demandes de devis du site (QuoteRequest)
CREATE TABLE IF NOT EXISTS "QuoteRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "need" TEXT NOT NULL,
    "desiredDate" TIMESTAMP(3),
    "location" TEXT,
    "organization" TEXT,
    "platforms" TEXT[],
    "cameras" TEXT,
    "participants" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'nouvelle',
    "quoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "QuoteRequest_clientId_idx" ON "QuoteRequest"("clientId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuoteRequest_clientId_fkey') THEN
    ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuoteRequest_quoteId_fkey') THEN
    ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. Textes des pages Contact, Portfolio, A propos et questions frequentes
--    (crees seulement s'ils n'existent pas)
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('contact_page', $t${"kicker": "Scène 06 · Contact", "title": "Parlons de", "titleAccent": "votre projet.", "lead": "Trois étapes, une minute. Votre demande arrive directement chez nous et vous recevez un devis détaillé sous 24h.", "zoneText": "Nous intervenons partout au Sénégal et dans la sous-région. Les frais de déplacement sont intégrés au devis.", "successTitle": "C’est *dans la boîte.*", "successText": "Un accusé de réception part par email. Notre équipe revient vers vous sous 24h avec un devis détaillé."}$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('portfolio_page', $t${"kicker": "Scène 04 · Portfolio", "title": "Ce qu’on a capté,", "titleAccent": "ce qu’on a diffusé.", "lead": "Événements, productions pour dirigeants, week-ends créateurs, formations. Cliquez sur une réalisation pour la voir.", "finalMarquee": "Le prochain, *c’est vous*", "finalText": "Votre événement mérite sa place ici.", "finalCtaLabel": "Réserver une date"}$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('about_page', $t${"kicker": "Scène 05 · À propos", "title": "Qui nous", "titleAccent": "sommes.", "lead": "Jolof Stream est une société spécialisée dans la captation et la diffusion en direct d’événements sur le web. Nous associons expertise technique et sensibilité multiculturelle pour offrir à vos événements une portée qui dépasse les frontières."}$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('faq_items', $t$[{"question": "Vous fournissez la connexion internet sur place ?", "answer": "Nous testons la connexion du lieu lors du repérage. Selon la formule, nous ajoutons une connexion 4G/5G de secours. Pour les grandes diffusions, nous préparons avec vous une liaison filaire dédiée."}, {"question": "Peut-on diffuser sur plusieurs plateformes en même temps ?", "answer": "Oui. Notre système de diffusion simultanée envoie votre direct sur YouTube, Facebook et Zoom en même temps, sans perte de qualité."}, {"question": "Est-ce qu’on récupère les vidéos après le live ?", "answer": "Toujours. Chaque caméra est enregistrée séparément en Full HD : vous pouvez remonter l’événement, créer des extraits, des teasers ou des replays."}, {"question": "Comment se passe le paiement ?", "answer": "Pour les services, un devis est validé avant toute prestation, avec un acompte selon le projet. Paiement par Wave Business ou virement. Pour les formations, vous recevez un lien Wave Business par email après inscription."}, {"question": "Quels délais de livraison ?", "answer": "48h pour le replay d’un événement, 5 jours ouvrés pour un Creator Weekend, et selon le forfait pour le CEO Content. La livraison se fait par lien privé Drive ou WeTransfer."}, {"question": "Vous intervenez en dehors de Dakar ?", "answer": "Oui, partout au Sénégal et dans la sous-région. Les frais de déplacement sont intégrés au devis."}, {"question": "Quels types d’événements couvrez-vous ?", "answer": "Nous couvrons tous types d’événements : conférences, galas, mariages, événements d’entreprise, formations, concerts. Si vous avez un projet spécifique, contactez-nous."}, {"question": "Proposez-vous des forfaits pour les associations et ONG ?", "answer": "Oui, nous proposons des tarifs adaptés pour les associations, ONG et structures éducatives. Mentionnez-le dans votre demande de devis."}]$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 3. Anciens textes de secours de la page A propos, copies en base avant leur
--    retrait du code : crees s'ils manquent, completes s'ils sont vides
--    (meme affichage qu'avant), jamais ecrases s'ils ont un contenu
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('about_history', $t$Jolof Stream est née de la conviction que chaque événement mérite d’être partagé avec le monde. Fondés à Dakar par deux passionnés de technologie et de création, nous avons construit une agence qui allie expertise technique et sensibilité multiculturelle.$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '';

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('about_mission', $t$Démocratiser l’accès aux événements en direct en offrant des solutions de captation et de diffusion professionnelles, accessibles et adaptées au contexte africain.$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '';

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('about_values', $t$[{"title": "Excellence technique", "description": "Matériel professionnel et qualité HD garantie sur chaque production."}, {"title": "Proximité", "description": "Nous comprenons le contexte local et les enjeux de chaque événement."}, {"title": "Fiabilité", "description": "Présence le jour J, backup systématique, zéro défaillance tolérée."}, {"title": "Innovation", "description": "Veille permanente sur les nouvelles technologies de diffusion."}]$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '';

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('about_stats', $t$[{"value": "50+", "label": "événements diffusés"}, {"value": "3", "label": "plateformes simultanées"}, {"value": "HD", "label": "qualité garantie"}, {"value": "2026", "label": "année de lancement"}]$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '';

-- 4. Documents legaux : modele V2 si le contenu est absent, vide ou egal au
--    texte d'attente du seed d'origine ; un contenu redige n'est pas touche
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('mentions_legales_content', $t$## Hébergement

Le site est hébergé par Vercel Inc. (États-Unis). La base de données et les fichiers sont hébergés chez Supabase Inc.

## Propriété intellectuelle

L’ensemble des contenus de ce site (textes, visuels, vidéos, logo) est la propriété de Jolof Stream ou de ses clients, et ne peut être reproduit sans autorisation écrite.

## Données personnelles

Les informations transmises via les formulaires (demande de devis, inscription aux formations) servent uniquement à traiter votre demande et à vous recontacter. Vous pouvez demander leur modification ou leur suppression à tout moment par email. Chaque email marketing contient un lien de désinscription.

Conformément à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, vous disposez d’un droit d’accès, de rectification et de suppression, à exercer par email.$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '' OR "Setting"."value" = $t$Mentions Legales - Jolof Stream

Editeur : Jolof Stream
Adresse : Dakar, Senegal
Contact : jolofstream@gmail.com$t$;

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('cgv_content', $t$## 1. Objet

Les présentes conditions encadrent les prestations de Jolof Stream : captation et diffusion en direct, CEO Content Package, Creator Weekend, publication réseaux et formations.

## 2. Devis et commande

Toute prestation fait l’objet d’un devis (référence DEV-AAAA-JS-XXX) valable 30 jours. La commande est ferme à l’acceptation du devis et, le cas échéant, au versement de l’acompte.

## 3. Prix et taxes

Les prix sont exprimés en francs CFA hors taxes. Selon le régime du client, le document porte soit le BRS de 5 %, soit la TVA de 18 % : les deux ne se cumulent pas. Un client exonéré de TVA le voit mentionné sur le document.

## 4. Paiement

Paiement par Wave Business ou virement bancaire. Aucun paiement n’est effectué directement sur le site. Selon le projet, un acompte est demandé à la signature, le solde à la livraison.

## 5. Annulation et report

Prestations : un report est accordé sans frais une fois si la demande arrive plus de 7 jours avant la date prévue. En cas d’annulation à moins de 7 jours, l’acompte versé reste acquis. Formations : annulation plus de 7 jours avant le début de la cohorte, remboursement intégral ; ensuite, report possible sur la cohorte suivante, sans remboursement.

## 6. Livraison des contenus

Les fichiers sont livrés par lien privé (Drive ou WeTransfer) dans les délais indiqués sur le devis : 48h pour un replay d’événement, 5 jours ouvrés pour un Creator Weekend.

## 7. Droits sur les contenus

Les droits d’utilisation des vidéos livrées sont cédés au client pour ses propres usages. Jolof Stream peut utiliser des extraits dans son portfolio, sauf refus écrit du client.

## 8. Responsabilité

Jolof Stream met en œuvre tous les moyens techniques pour assurer la diffusion. Sa responsabilité ne peut être engagée en cas de défaillance de la connexion fournie par le lieu, de coupure électrique ou de force majeure.

## 9. Formations

L’inscription se fait par cohorte. La place est pré-réservée pendant {delai_paiement} dans l’attente du paiement Wave Business, puis confirmée à réception. Sans paiement dans ce délai, elle peut être libérée. Une cohorte complète ouvre une liste d’attente, par ordre d’inscription.

## 10. Droit applicable

Les présentes conditions sont soumises au droit sénégalais.$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
WHERE btrim("Setting"."value") = '' OR "Setting"."value" = $t$Conditions Generales de Vente - Jolof Stream

A completer juridiquement avant publication.$t$;

-- 5. Responsable de publication (Parametres > Informations de l'agence)
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('company_publication_manager', '', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 6. Retrait de la liste newsletter des contacts (contacts conserves ;
--    les campagnes deja envoyees ne sont pas modifiees)
UPDATE "MarketingContact"
SET "lists" = array_remove("lists", 'newsletter')
WHERE 'newsletter' = ANY("lists");
