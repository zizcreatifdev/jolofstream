# Recette de production : refonte V2 Cinéma

À dérouler sur https://jolofstream.com après le déploiement Vercel, sur un ordinateur (Chrome) et un téléphone (iPhone Safari et Android Chrome). Chaque ligne donne l'action puis le résultat attendu. Cocher au fur et à mesure ; noter toute anomalie avec la page, l'appareil et l'heure.

Préalables :

- [ ] Ouvrir Vercel, dernier déploiement de main → statut « Ready », sans erreur de build.
- [ ] Ouvrir https://jolofstream.com/robots.txt → `Disallow: /admin`, `Disallow: /api` et la ligne `Sitemap: https://jolofstream.com/sitemap.xml`.
- [ ] Ouvrir https://jolofstream.com/sitemap.xml → 8 adresses (accueil, services, formations, portfolio, à propos, contact, mentions légales, CGV), aucune adresse /portfolio/... ni /formations/reserver.
- [ ] Outils de développement, onglet Réseau, recharger l'accueil → en-têtes `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`.

## Accueil (/)

### Hero

- [ ] Admin, Paramètres > Contenu du site > Hero : ouvrir la slide 1 et noter son lien YouTube → le lien est au format watch, youtu.be, shorts, embed ou live ; l'aperçu affiche la vidéo.
- [ ] Même contrôle sur la slide 2 → lien YouTube valide, aperçu correct.
- [ ] Sur le site, laisser défiler le carrousel → les 2 slides alternent, la barre de progression avance, les flèches et la pause répondent.
- [ ] Cliquer « Regarder avec le son » (ou le libellé saisi) → le lecteur plein écran s'ouvre avec le son ; Échap ou « Fermer le lecteur » le referme et rend le focus au bouton.
- [ ] Badge avec le jeton : dans l'admin, saisir `Prochaine cohorte | {prochaine-cohorte}` sur une slide → sous le champ, « Valeur actuelle : Prochaine cohorte | Cohorte … · date » ; l'aperçu montre le badge avec la cohorte, jamais le texte `{prochaine-cohorte}` brut.
- [ ] Sur le site (attendre une minute), la pastille du hero affiche la même prochaine cohorte ouverte.
- [ ] Fermer toutes les cohortes ouvertes en test (ou vérifier sur une préproduction) → la pastille disparaît du site, l'admin indique « aucune cohorte ouverte, le badge est masqué sur le site ».
- [ ] Ouvrir l'accueil dans une fenêtre privée → le rideau d'introduction se joue une fois ; recharger dans le même onglet → le rideau ne se rejoue pas.
- [ ] iPhone (Safari), réglages par défaut, mode économie d'énergie désactivé → la vidéo du hero démarre seule, sans son, sans plein écran forcé.
- [ ] iPhone en mode économie d'énergie → la couverture (poster) s'affiche à la place de la vidéo, sans icône de lecture cassée.
- [ ] Texte du hero lisible sur les deux vidéos réelles, y compris sur les plans clairs (voile renforcé en P6).

### Sections

- [ ] Faire défiler le manifeste → les mots s'allument progressivement ; avant allumage ils restent lisibles (crème atténuée) ; mots rouges et jaunes prennent leur couleur une fois allumés.
- [ ] Savoir-faire : cliquer chaque ligne → l'image et le texte changent ; numéro décoratif en fond.
- [ ] Réalisations épinglées (Safari macOS, Firefox, Chrome) → la section reste épinglée pendant le défilement horizontal, sans saut ; « Ouvrir le portfolio » mène à /portfolio.
- [ ] Offres : cartes empilées sur bureau, simples sur mobile ; carte Formations avec les 2 prochaines cohortes, chaque lien ouvre le tunnel avec la bonne cohorte.
- [ ] Témoignages : seuls les témoignages publiés avec accord apparaissent.
- [ ] Appel final : bandeau défilant, bouton devis et téléphone cliquable sur mobile.

## Services (/services)

- [ ] Ouvrir /services → 4 chapitres, navigation collante à gauche sur grand écran, chapitre courant mis en évidence.
- [ ] Ouvrir /services?s=ceo → la page s'ouvre sur le chapitre CEO Content.
- [ ] Les prix « À partir de » correspondent au Catalogue de l'admin (modifier une offre, attendre une minute, recharger).

## Formations (/formations)

- [ ] Ouvrir /formations → un bloc par programme publié, cohortes avec statut, places et dates (heure de Dakar).
- [ ] Ouvrir https://jolofstream.com/formations/rmpd (slug du programme) → redirection vers /formations#rmpd.
- [ ] Ouvrir /formations/<id d'une cohorte ouverte> → redirection vers /formations/reserver?f=…&c=… avec la cohorte présélectionnée.
- [ ] Ouvrir /formations/<id d'une cohorte passée ou annulée> → redirection vers /formations.
- [ ] Ouvrir /formations/nimporte-quoi → page 404.

### Plaquette RMPD

- [ ] Admin, Formations > programme RMPD > Plaquette : téléverser le PDF final (10 Mo maximum) → nom et taille affichés, statut brouillon.
- [ ] Publier la plaquette → le bloc « Plaquette de la formation » apparaît sur /formations et dans le récapitulatif du tunnel.
- [ ] Sur téléphone, toucher « Télécharger la plaquette » → le PDF se télécharge avec le nom prévu (Jolof-Stream-Formation-RMPD.pdf ou celui saisi).
- [ ] Toucher « Lire en ligne » → le PDF s'ouvre dans le navigateur sans téléchargement forcé.
- [ ] Copier le lien public stable /formations/rmpd/plaquette, le partager sur WhatsApp, l'ouvrir depuis un autre téléphone → le PDF s'ouvre.
- [ ] Remplacer le PDF par une nouvelle version → le même lien public sert la nouvelle version (cache vidé).

## Réservation (/formations/reserver), de bout en bout

- [ ] Sur /formations/reserver, toucher la formation puis la cohorte → chaque choix fait passer seul à l'étape suivante.
- [ ] Réserver une vraie place sur une cohorte ouverte avec un email personnel → étape 4 « place pré-réservée », date limite de paiement affichée en heure de Dakar.
- [ ] Boîte mail du participant → email « Inscription enregistrée » avec cohorte, dates, lieu, montant, bouton Wave (montant prérempli), date limite et lien plaquette ; accents corrects, aucun lien en localhost.
- [ ] Boîte mail des admins → notification de nouvelle inscription.
- [ ] Admin, cohorte → la réservation apparaît « En attente » avec l'échéance ; le tableau de bord la compte.
- [ ] Attendre l'échéance (ou réduire le délai à 24 h dans Paramètres > Formations sur une réservation de test) → la réservation passe dans le filtre « hors délai ».
- [ ] Bouton Relancer → email de relance reçu avec un nouveau délai ; journal mis à jour.
- [ ] Bouton Prolonger → nouvelle échéance affichée, aucun email si non demandé.
- [ ] Bouton Libérer → place libérée ; si une liste d'attente existe, la première personne reçoit l'email « Une place s'est libérée » avec son propre délai.
- [ ] Remplir une cohorte de test puis réserver → le tunnel propose « Rejoindre la liste d'attente », l'étape 4 affiche la position.
- [ ] Confirmer un paiement → email « Paiement confirmé » reçu, reçu PDF téléchargeable depuis l'admin.
- [ ] Envoyer plus de 10 réservations en une heure depuis la même connexion (test volontaire) → message « Trop de réservations envoyées depuis cette connexion… », aucune fausse confirmation.
- [ ] Supprimer ou annuler les réservations de test.

## Portfolio (/portfolio)

- [ ] Filtres par type → seules les réalisations publiées du type ; l'adresse reflète le filtre (?type=…).
- [ ] Ouvrir une photo puis une vidéo → la visionneuse s'ouvre, le focus est sur « Fermer », Tab reste dans la visionneuse, Échap la ferme et rend le focus à la carte.
- [ ] Admin, Portfolio : dépublier une réalisation → elle disparaît du site en une minute ; l'API publique ne la renvoie plus.

## À propos (/a-propos)

- [ ] Histoire, mission, valeurs, équipe et chiffres viennent des Paramètres ; aucun texte d'exemple.
- [ ] Les photos d'équipe s'affichent nettes, sans déformation.

## Contact (/contact) et demandes de devis

- [ ] Ouvrir /contact, toucher une carte de besoin → la carte s'allume puis l'étape 2 s'affiche seule, avec « Votre besoin : … · Modifier » en haut.
- [ ] Ouvrir /contact?besoin=evenement-live → l'assistant s'ouvre directement à l'étape 2 ; sans rien cocher, « Continuer » → messages « Choisissez au moins une plateforme, ou « Pas de diffusion » » et « Choisissez un nombre de caméras, ou « Je ne sais pas » ».
- [ ] Envoyer une vraie demande de devis (événement en direct) → écran de succès ; email d'accusé de réception reçu par le demandeur ; notification reçue par les admins avec le lien vers la demande.
- [ ] Admin, Demandes → la demande apparaît « Nouvelle », la pastille du menu s'incrémente.
- [ ] Ouvrir la demande puis « Créer un devis » → le formulaire de devis est prérempli (client, objet, description) ; enregistrer → la demande passe « Devis envoyé » ou « Convertie » selon l'action, le devis est lié à la demande.
- [ ] FAQ : chaque question s'ouvre et se ferme à la souris et au clavier (Entrée, Espace).

## Galerie (/galerie) et albums

- [ ] Admin > Galerie > Nouvel album : titre, catégorie → l'album s'ouvre en brouillon, slug généré (modifiable).
- [ ] Basculer « Publié » sans photo → refus avec « Ajoutez au moins une photo avant de publier l'album. »
- [ ] Glisser 20 vraies photos de téléphone (dont une prise en portrait) dans la zone d'envoi → 3 envois à la fois, progression par fichier, toutes « Terminé ».
- [ ] Couper le Wi-Fi pendant un envoi puis le rétablir → le fichier passe en « Échec », les autres continuent ; « Réessayer » le termine.
- [ ] Supabase Storage, bucket « galerie » → pour chaque photo, une grande taille (1 Mo maximum) et une miniature « -mini » (250 Ko maximum), en WebP.
- [ ] Télécharger une grande taille depuis Supabase et l'ouvrir dans un lecteur EXIF → aucune donnée EXIF ni GPS ; la photo portrait est droite.
- [ ] Réordonner par glisser-déposer et par flèches, « Définir comme couverture », modifier le texte alternatif et la légende d'une photo → enregistré après rechargement.
- [ ] Sélectionner 3 photos, « Supprimer la sélection » → photos retirées et fichiers supprimés de Supabase (grande taille et miniature).
- [ ] Lier un album à la formation RMPD, le publier → /formations affiche 6 miniatures sous le programme et « Voir l'album ».
- [ ] /galerie : filtres Tous, Événements, Formations, Coulisses (seulement les catégories qui ont un album), l'adresse change en ?categorie=… ; un lien direct avec ?categorie=formations ouvre le bon filtre.
- [ ] Ouvrir un album → grille sans recadrage ; toucher une photo → visionneuse plein écran, glissement du doigt pour passer d'une photo à l'autre, compteur « 3 / 20 », légende ; Échap (ordinateur) ferme et rend le focus à la miniature.
- [ ] Album repassé en brouillon → son adresse renvoie une page 404 ; il disparaît de /galerie et de l'accueil.
- [ ] Accueil : bande Galerie entre Offres et Témoignages avec les 10 photos les plus récentes, chaque photo mène à son album ; « Voir la galerie » ouvre /galerie.
- [ ] Partager l'adresse d'un album sur WhatsApp → l'aperçu affiche la miniature de couverture et le titre.
- [ ] Supprimer un album de test → confirmation, puis album, photos et fichiers supprimés.

## En-têtes de pages

- [ ] Paramètres > Contenu du site > En-têtes de pages : pour Services, envoyer une grande photo (8 Mo) → aperçu immédiat, fichier de 1 Mo maximum dans Supabase (bucket hero, dossier entetes).
- [ ] Choisir le cadrage Haut, Centre, Bas et saisir le texte alternatif → « Enregistrer le cadrage », l'aperçu et le site suivent.
- [ ] Ouvrir /services sur ordinateur et téléphone → image plein cadre, léger zoom arrière à l'apparition (aucun en mouvement réduit), titre et chapeau lisibles même sur une photo claire.
- [ ] Répéter sur Formations, Portfolio, Galerie, À propos et Contact.
- [ ] « Remplacer » → nouvelle image en ligne, l'ancien fichier disparaît de Supabase ; « Retirer » → en-tête noir d'origine, fichier supprimé.
- [ ] Mentions légales et CGV : aucun en-tête image (non concernées).

## Pages légales

- [ ] Admin, Paramètres > Informations de l'agence : renseigner NINEA, RC, forme juridique, adresse, responsable de la publication → enregistrés.
- [ ] Ouvrir /mentions-legales → bloc « Éditeur du site » avec NINEA, RC et responsable de la publication ; hébergeurs Vercel et Supabase.
- [ ] Relire intégralement les CGV V2 (Paramètres > Documents légaux, aperçu) avec le délai de paiement réel → aucune mention « à compléter », montants et délais cohérents avec Paramètres > Formations.
- [ ] Ouvrir /cgv → texte identique à l'aperçu, titres et listes bien rendus.

## Navigation commune, accessibilité et mobile

- [ ] Téléphone : bouton « Menu » → menu plein écran ; Échap ou « Fermer le menu » le referme ; les liens mènent aux bonnes pages avec la transition « coupe de montage ».
- [ ] Clavier seul sur l'accueil : première tabulation → « Aller au contenu » visible ; chaque élément montre un contour de focus.
- [ ] HUD en-tête : SCÈNE 01 à 09 selon la page (Galerie 05, À propos 06, Contact 07, Mentions légales 08, CGV 09), SCÈNE 03 · RÉSERVATION dans le tunnel ; même numéro devant le surtitre de chaque page.
- [ ] Safari macOS et Firefox : accueil (réalisations épinglées, manifeste), services (navigation collante), formations, tunnel complet → aucun décalage ni élément figé.
- [ ] Lighthouse mobile (Chrome, navigation privée) sur /, /formations et /contact → Performance ≥ 85 sur l'accueil, Accessibilité, Bonnes pratiques et SEO ≥ 95, CLS < 0,1.

## Admin : contenus et médias

### Images du savoir-faire

- [ ] Paramètres > Contenu du site > Accueil > Savoir-faire : téléverser une image JPG ou WebP (500 Ko maximum) → aperçu, enregistrement, image visible sur l'accueil.
- [ ] Remplacer l'image par une autre → nouvelle image sur le site ; dans Supabase Storage, bucket « site », l'ancien fichier a disparu.
- [ ] Envoyer une image PNG de 2 Mo → acceptée et optimisée (message « Image optimisée : … vers … », 450 Ko au plus).

### Images V1 (signature, équipe, avatars, portfolio)

- [ ] Paramètres > Documents PDF : téléverser une signature PNG → aperçu et enregistrement ; elle apparaît, sans fond blanc, sur le PDF d'un contrat.
- [ ] Portfolio : ajouter une photo → téléversement direct (URL signée), réalisation visible après publication.

### Témoignages

- [ ] Créer un témoignage sans cocher l'accord et cocher Publier → enregistrement refusé avec un message clair.
- [ ] Cocher l'accord écrit ou oral puis publier → visible sur l'accueil (ou sur /formations s'il est rattaché à un programme).
- [ ] Décocher l'accord d'un témoignage publié et enregistrer → refus avec message tant qu'il reste publié ; le dépublier d'abord.

## Compression des médias

- [ ] Avec un iPhone (ou un téléphone Android), prendre une photo en portrait et l'envoyer depuis l'admin en production : Paramètres > Contenu du site > Témoignages > Nouveau témoignage > Photo. Le message « Image optimisée : X Mo vers Y Ko » s'affiche, l'aperçu est à l'endroit (pas couché), la photo fait 250 Ko au plus dans Supabase Storage (bucket « site »).
- [ ] Même essai sur une couverture du hero (900 Ko au plus, bucket « hero ») et sur une photo du portfolio.
- [ ] Télécharger la photo envoyée depuis Supabase et vérifier qu'elle ne contient plus de position GPS (propriétés du fichier ou un lecteur EXIF).
- [ ] Filmer 20 à 30 s avec le téléphone, transférer la vidéo sur un ordinateur, puis dans Chrome ou Edge à jour : Contenu du site > Hero > Nouvelle slide > Vidéo de fond « Fichier vidéo ». La barre de progression avance, le message « Vidéo optimisée : X Mo vers Y Mo (… , son conservé) » s'affiche, la couverture se remplit seule. Enregistrer : la vidéo boucle sur l'accueil, la couverture apparaît avant la lecture.
- [ ] Pendant une compression, cliquer sur Annuler → « Compression annulée. », rien n'est envoyé. Tenter de fermer l'onglet pendant une compression → le navigateur demande confirmation.
- [ ] Envoyer une vidéo de plus de 60 s → refus « Vidéo trop longue pour un fond de hero : ajoutez-la plutôt en lien YouTube ».
- [ ] Si possible, refaire l'essai vidéo sur Safari (macOS) et Firefox : la compression fonctionne, ou un message clair invite à utiliser Chrome, Edge ou un lien YouTube.
- [ ] Paramètres > Maintenance > « Analyser » : la liste montre les images plus lourdes que leur cible (emplacement, taille actuelle, taille après traitement) ; rien n'est modifié à ce stade.
- [ ] « Optimiser N images » puis confirmer : la progression avance par lots, le message final indique le nombre d'images et le gain. Vérifier sur le site que les images s'affichent toujours, puis dans Supabase que les anciens fichiers ont disparu. Relancer « Analyser » : « Aucune image à optimiser ».
- [ ] Journal d'activité : une ligne « Images optimisées : N, gain X ».

## Admin : modules métier (non-régression)

- [ ] Connexion admin1 et admin2, déconnexion.
- [ ] Devis : créer, envoyer par email (email reçu, PDF lisible avec accents), convertir en facture.
- [ ] Facture : marquer payée, relancer une facture impayée (email reçu), créer un avoir.
- [ ] Contrats : générer un PDF (zones de signature en trait plein), envoyer par email.
- [ ] Comptabilité : exports Excel (onglet « Résumé ») et PDF lisibles.
- [ ] Mail marketing : envoyer une campagne de test → liens du message vers jolofstream.com, clic compté dans les statistiques ; lien de désabonnement → page « Désabonnement confirmé ».
- [ ] Ancien email de campagne (envoyé avant P6) : le lien de désabonnement fonctionne toujours.
- [ ] Notifications, calendrier, journal, tâches : affichage sans erreur, libellés en français accentué.

## Emails et Resend

- [ ] Resend > Logs : chaque email de la recette apparaît « Delivered » (aucun « Bounced » ni « Failed »), expéditeur sur le domaine vérifié.
- [ ] Ouvrir chaque type d'email reçu (accusé de devis, inscription, liste d'attente, place libérée, relance de paiement, paiement confirmé, devis, facture, relance facture, contrat, campagne) → accents corrects, aucun tiret long, liens absolus vers https://jolofstream.com.

## Après la recette

- [ ] Supprimer les données de test (réservations, demandes, devis, campagnes).
- [ ] Google Search Console : soumettre https://jolofstream.com/sitemap.xml.
