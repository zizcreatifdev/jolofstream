-- Refonte V2, prompt 2 : accueil, services et temoignages
-- Script idempotent : peut etre execute plusieurs fois dans l'editeur SQL Supabase.

-- 1. Temoignages : type enumere, table, index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TestimonialContext') THEN
    CREATE TYPE "TestimonialContext" AS ENUM ('GENERAL', 'FORMATION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "photoUrl" TEXT,
    "context" "TestimonialContext" NOT NULL DEFAULT 'GENERAL',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Testimonial_context_published_order_idx"
  ON "Testimonial"("context", "published", "order");

-- 2. Migration du setting JSON "testimonials" vers la table (ordre conserve,
--    text vers quote, name vers authorName, organization vers authorRole,
--    note sur 5 abandonnee). Les 3 exemples fictifs du seed d'origine sont
--    importes en brouillon, sans accord : ils ne doivent pas etre publies.
--    Le setting est supprime ensuite. JSON illisible : setting conserve, avis.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Setting" WHERE "key" = 'testimonials') THEN
    INSERT INTO "Testimonial" (
      "id", "quote", "authorName", "authorRole", "context",
      "consent", "published", "order", "updatedAt"
    )
    SELECT
      'tm_legacy_' || t.ord,
      LEFT(BTRIM(t.elem->>'text'), 400),
      LEFT(BTRIM(t.elem->>'name'), 80),
      NULLIF(LEFT(BTRIM(COALESCE(t.elem->>'organization', '')), 120), ''),
      'GENERAL'::"TestimonialContext",
      NOT is_example,
      NOT is_example,
      (t.ord - 1)::int,
      CURRENT_TIMESTAMP
    FROM "Setting" s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s."value"::jsonb) = 'array' THEN s."value"::jsonb ELSE '[]'::jsonb END
    ) WITH ORDINALITY AS t(elem, ord)
    CROSS JOIN LATERAL (
      SELECT BTRIM(t.elem->>'text') IN (
          'Jolof Stream a transforme notre conference annuelle en un evenement vu par toute la diaspora. Production impeccable.',
          'Le Creator Weekend nous a permis de produire trois mois de contenu en deux jours.',
          'Streaming bilingue francais-wolof sans accroc pour notre gala.'
        ) AS is_example
    ) ex
    WHERE s."key" = 'testimonials'
      AND COALESCE(BTRIM(t.elem->>'text'), '') <> ''
      AND COALESCE(BTRIM(t.elem->>'name'), '') <> ''
    ON CONFLICT ("id") DO NOTHING;

    DELETE FROM "Setting" WHERE "key" = 'testimonials';
  END IF;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE NOTICE 'Setting testimonials illisible (JSON invalide) : non migre, conserve.';
END $$;

-- 3. Parcours d'anciens de la formation : brouillons sans accord de
--    publication, inseres seulement si aucun temoignage FORMATION n'existe
INSERT INTO "Testimonial" (
  "id", "quote", "authorName", "authorRole", "context",
  "consent", "published", "order", "updatedAt"
)
SELECT seed.id, seed.quote, seed.name, seed.role, 'FORMATION'::"TestimonialContext",
       false, false, seed.ord, CURRENT_TIMESTAMP
FROM (VALUES
    ('tm_alumni_arame_diaw', $q$Venue du design, elle est devenue l'une des cadreuses les plus sollicitées de l'université, surnommée Mrs CAM 1. Elle réalise aujourd'hui la plupart des plateaux d'une chaîne de télévision.$q$, $q$Arame Diaw$q$, $q$Réalisatrice TV$q$, 0),
    ('tm_alumni_diama_gueye', $q$Elle a découvert la réalisation multicam chez Jolof Stream. Depuis, elle a réalisé la première cérémonie de graduation de l'UGB et de nombreux événements.$q$, $q$Diama Gueye$q$, $q$Réalisatrice, Solo Média Groupe$q$, 1),
    ('tm_alumni_khassime_niang', $q$Après la formation, il s'est affirmé comme réalisateur, avec une ambition claire : multiplier les expériences et explorer de nouveaux horizons.$q$, $q$Khassime Niang$q$, $q$Réalisateur$q$, 2)
) AS seed (id, quote, name, role, ord)
WHERE NOT EXISTS (SELECT 1 FROM "Testimonial" WHERE "context" = 'FORMATION');

-- 4. Contenus administrables de l'accueil et de la page Services (JSON)
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES
  ('home_manifesto', $json${"kicker": "Manifeste", "text": "Nous ne branchons pas des câbles. *Nous captons l’émotion* d’un instant et nous l’envoyons partout dans le monde, **en direct,** pendant que vous vivez le vôtre."}$json$, CURRENT_TIMESTAMP),
  ('home_skills', $json${"kicker": "Savoir-faire", "title": "Six métiers,", "titleAccent": "un seul direct.", "items": [{"title": "Captation multi-caméras HD", "description": "Chaque caméra est placée pour capter l’essence de l’événement : plans larges, gros plans, réactions du public. Notre régie mobile passe d’un angle à l’autre en temps réel.", "imageUrl": null}, {"title": "Streaming simultané", "description": "YouTube, Facebook et Zoom en même temps, sans compromis sur la qualité. Votre audience vous suit là où elle se trouve.", "imageUrl": null}, {"title": "Habillage graphique", "description": "Titres, bandeaux, transitions : une identité visuelle 100 % personnalisée, fidèle à votre univers, intégrée à la régie.", "imageUrl": null}, {"title": "Modération des chats", "description": "Un espace d’échange sain et respectueux pendant le live. Vos spectateurs se sentent écoutés et participent davantage.", "imageUrl": null}, {"title": "Enregistrement par caméra", "description": "Chaque angle est enregistré séparément en Full HD : replays, highlights, teasers et contenus réseaux sans perte de qualité.", "imageUrl": null}, {"title": "Support technique de A à Z", "description": "Du premier test au dernier plan, nous gérons toute la technique. Vous vous concentrez sur votre événement.", "imageUrl": null}]}$json$, CURRENT_TIMESTAMP),
  ('home_final_cta', $json${"marquee": "Votre prochain *direct*", "text": "Dites-nous ce que vous préparez. Devis détaillé sous 24h, partout au Sénégal et dans la sous-région.", "cta1Label": "Demander un devis", "cta1Href": "/contact"}$json$, CURRENT_TIMESTAMP),
  ('home_sections', $json${"worksKicker": "Réalisations", "worksTitle": "Ce qu’on a", "worksTitleAccent": "capté.", "worksText": "Faites défiler : chaque plan est un événement diffusé en direct.", "offersKicker": "Offres", "offersTitle": "Trois façons de", "offersTitleAccent": "passer à l’écran.", "formationsTitle": "Passez derrière la caméra", "formationsText": "Sessions pratiques en petit groupe, sur notre matériel. Choisissez votre cohorte, payez ensuite par lien Wave Business reçu par email.", "testimonialsKicker": "Témoignages", "testimonialsTitle": "Ils nous ont", "testimonialsTitleAccent": "confié leur direct."}$json$, CURRENT_TIMESTAMP),
  ('services_content', $json${"live": {"kicker": "Diffusion en direct", "title": "Captation et", "titleAccent": "streaming live", "intro": "Production HD multi-caméras et diffusion en direct sur toutes les plateformes : YouTube, Facebook, LinkedIn, sites privés. Régie complète et équipe expérimentée.", "included": ["Captation 2 à 4 caméras HD ou 4K", "Régie multi-sources avec habillage graphique", "Diffusion multi-plateformes simultanée", "Enregistrement complet et replay archivé", "Modération des chats et commentaires", "Support technique de A à Z"], "steps": [{"title": "Briefing et préparation", "description": "On comprend l’événement et l’audience. Devis sous 24h."}, {"title": "Installation sur site", "description": "Repérage, setup, essais son et image, plateformes connectées."}, {"title": "Diffusion en direct", "description": "Réalisation, modération des chats, diffusion simultanée."}, {"title": "Livraison des masters", "description": "Replay et fichiers de chaque caméra en Full HD."}]}, "ceo": {"kicker": "Image de marque", "title": "CEO", "titleAccent": "Content", "intro": "Construisez votre image de dirigeant avec des contenus vidéo professionnels mensuels. Format clé en main, du tournage à la publication.", "included": ["Sessions de tournage mensuelles", "Capsules vidéo montées et sous-titrées", "Coaching de prise de parole", "Publication réseaux optionnelle", "Déplacement avec setup complet", "Caméras, lumière et son professionnels", "Livraison Drive ou WeTransfer"], "steps": [{"title": "Consultation mensuelle", "description": "Sujets, formats, ton : on prépare ensemble."}, {"title": "Tournage", "description": "Session chez vous, setup installé en moins d’une heure."}, {"title": "Montage et livraison", "description": "Formats courts et longs, sous-titrés, livrés par lien privé."}, {"title": "Publication optionnelle", "description": "Sur vos réseaux, au bon format et au bon moment."}]}, "creator": {"kicker": "Production intensive", "title": "Creator", "titleAccent": "Weekend", "intro": "Un week-end entier dédié à la création de votre contenu. Tournage intensif, montage et livraison de tous les livrables en une session.", "included": ["2 jours de tournage intensif", "10 à 30 livrables prêts à publier", "Studio mobile avec éclairage cinéma", "Coaching de cadrage et lumière", "Réalisation de votre concept", "Habillage à votre image", "Livraison sous 5 jours"], "steps": [{"title": "Préparation du concept", "description": "Idées, références, nombre de vidéos visées."}, {"title": "Tournage 2 jours", "description": "Samedi et dimanche : installation, tournages, plans complémentaires."}, {"title": "Montage", "description": "Montage tous formats, habillage à votre image."}, {"title": "Livraison", "description": "Vidéos montées, prêtes à publier, sous cinq jours."}]}, "social": {"kicker": "Add-on", "title": "Publication", "titleAccent": "réseaux", "intro": "Confiez-nous la diffusion de vos contenus sur Instagram, Facebook, LinkedIn et TikTok. En option sur toutes nos productions, au bon format et au bon moment.", "included": ["Stratégie éditoriale mensuelle", "Formats par plateforme", "Programmation et publication", "Reporting des performances", "Calendrier de publication", "Rédaction des légendes"], "steps": []}}$json$, CURRENT_TIMESTAMP),
  ('services_page', $json${"kicker": "Scène 02 · Services", "title": "Des prestations", "titleAccent": "sur mesure.", "lead": "Du direct multi-caméras à la production de contenu chez vous : quatre offres, une même exigence technique.", "finalMarquee": "On s’occupe *de tout*", "finalText": "Un projet qui ne rentre dans aucune case ? Parlons-en, on construit la formule avec vous."}$json$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 5. Nettoyage de l'ancien hero (image de fond et 3 statistiques)
DELETE FROM "Setting" WHERE "key" IN (
  'hero_background_image',
  'hero_stat_1_value', 'hero_stat_1_label',
  'hero_stat_2_value', 'hero_stat_2_label',
  'hero_stat_3_value', 'hero_stat_3_label'
);

-- 6. Bucket Supabase Storage "site" (public) pour les images de contenu :
--    JPG ou WebP, 500 Ko maximum. Ignore hors Supabase (schema storage absent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('site', 'site', true, 512000, ARRAY['image/jpeg', 'image/webp'])
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
