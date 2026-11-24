-- Hero de l'accueil : carrousel video (prompt V2-P1)
-- Script idempotent : peut etre execute plusieurs fois dans l'editeur SQL Supabase.

-- 1. Type enumere des videos de slide
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HeroVideoType') THEN
    CREATE TYPE "HeroVideoType" AS ENUM ('YOUTUBE', 'MP4', 'NONE');
  END IF;
END $$;

-- 2. Table des slides
CREATE TABLE IF NOT EXISTS "HeroSlide" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "kicker" TEXT NOT NULL,
    "titleLine1" TEXT NOT NULL,
    "titleLine2" TEXT NOT NULL,
    "accentText" TEXT,
    "description" TEXT NOT NULL,
    "videoType" "HeroVideoType" NOT NULL DEFAULT 'NONE',
    "youtubeUrl" TEXT,
    "youtubeId" TEXT,
    "mp4Url" TEXT,
    "posterUrl" TEXT,
    "cta1Label" TEXT NOT NULL,
    "cta1Href" TEXT NOT NULL,
    "cta2Label" TEXT,
    "cta2Href" TEXT,
    "soundLabel" TEXT NOT NULL DEFAULT 'Regarder avec le son',
    "badgeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HeroSlide_active_order_idx" ON "HeroSlide"("active", "order");

-- 3. Donnees initiales : 2 slides reprises de la maquette, sans video
--    (inserees seulement si la table est vide)
INSERT INTO "HeroSlide" (
  "id", "order", "active", "kicker", "titleLine1", "titleLine2", "accentText",
  "description", "videoType", "cta1Label", "cta1Href", "cta2Label", "cta2Href",
  "soundLabel", "badgeText", "updatedAt"
)
SELECT * FROM (VALUES
  (
    'hero_showreel', 0, true,
    'Showreel 2026 · Captation et streaming',
    'Capturez l’instant,', 'diffusez l’émotion.', 'diffusez',
    'Multi-caméras Full HD, régie mobile, habillage à vos couleurs. Votre événement part en direct sur YouTube, Facebook et Zoom, partout dans le monde.',
    'NONE'::"HeroVideoType", 'Demander un devis', '/contact', 'Nos services', '/services',
    'Regarder avec le son', NULL, CURRENT_TIMESTAMP
  ),
  (
    'hero_formations', 1, true,
    'Formations · Places limitées',
    'Passez derrière', 'la caméra.', 'la caméra.',
    'Sessions pratiques en petit groupe sur notre matériel professionnel. Vous repartez capable de capter et diffuser un événement en direct.',
    'NONE'::"HeroVideoType", 'Réserver ma place', '/formations', 'Voir les sessions', '/formations',
    'Voir la vidéo formations', 'Prochaine cohorte | Captation Live', CURRENT_TIMESTAMP
  )
) AS seed (
  "id", "order", "active", "kicker", "titleLine1", "titleLine2", "accentText",
  "description", "videoType", "cta1Label", "cta1Href", "cta2Label", "cta2Href",
  "soundLabel", "badgeText", "updatedAt"
)
WHERE NOT EXISTS (SELECT 1 FROM "HeroSlide");

-- 4. Duree d'une slide (secondes), parametre du site
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('hero_slide_duration', '10', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 5. Bucket Supabase Storage "hero" (public) pour les videos MP4/WebM et les
--    images de couverture. Ignore hors Supabase (schema storage absent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'hero', 'hero', true, 15728640,
      ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
