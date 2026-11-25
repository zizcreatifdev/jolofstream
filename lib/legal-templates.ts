// Modeles V2 des documents legaux (maquette #p-cgv et #p-mentions). Syntaxe :
// « ## » titre, ligne vide = paragraphe, « - » = liste, {delai_paiement}
// remplace par le delai de paiement des formations. Source du SQL de la
// migration 20261127120000_v2_p5 et du bouton « Charger le modèle V2 ».

export const CGV_TEMPLATE_V2 = `## 1. Objet

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

Les présentes conditions sont soumises au droit sénégalais.`

export const MENTIONS_TEMPLATE_V2 = `## Hébergement

Le site est hébergé par Vercel Inc. (États-Unis). La base de données et les fichiers sont hébergés chez Supabase Inc.

## Propriété intellectuelle

L’ensemble des contenus de ce site (textes, visuels, vidéos, logo) est la propriété de Jolof Stream ou de ses clients, et ne peut être reproduit sans autorisation écrite.

## Données personnelles

Les informations transmises via les formulaires (demande de devis, inscription aux formations) servent uniquement à traiter votre demande et à vous recontacter. Vous pouvez demander leur modification ou leur suppression à tout moment par email. Chaque email marketing contient un lien de désinscription.

Conformément à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, vous disposez d’un droit d’accès, de rectification et de suppression, à exercer par email.`

// Textes d'attente du seed d'origine : consideres comme vides par la
// migration (jamais un contenu redige par l'equipe)
export const LEGACY_CGV_PLACEHOLDER =
  "Conditions Generales de Vente - Jolof Stream\n\nA completer juridiquement avant publication."
export const LEGACY_MENTIONS_PLACEHOLDER =
  "Mentions Legales - Jolof Stream\n\nEditeur : Jolof Stream\nAdresse : Dakar, Senegal\nContact : jolofstream@gmail.com"
