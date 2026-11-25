-- Refonte V2, prompt 7 : galerie photos par albums et images d'en-tête des pages.
-- Migration additive et idempotente : exécutable plusieurs fois dans
-- l'éditeur SQL Supabase. Aucun contenu déjà rédigé n'est écrasé.

-- 1. Albums de la galerie
CREATE TABLE IF NOT EXISTS "GalleryAlbum" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "category" TEXT NOT NULL,
    "programId" TEXT,
    "coverPhotoId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GalleryAlbum_slug_key" ON "GalleryAlbum"("slug");
CREATE INDEX IF NOT EXISTS "GalleryAlbum_published_category_date_idx" ON "GalleryAlbum"("published", "category", "date");

-- 2. Photos (grande taille et miniature)
CREATE TABLE IF NOT EXISTS "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "thumbPath" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GalleryPhoto_albumId_order_idx" ON "GalleryPhoto"("albumId", "order");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GalleryAlbum_programId_fkey') THEN
    ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_programId_fkey"
      FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GalleryPhoto_albumId_fkey') THEN
    ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_albumId_fkey"
      FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Bucket Storage public « galerie » (JPEG et WebP, 3 Mo), aussi créé
--    automatiquement au premier envoi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('galerie', 'galerie', true, 3145728, ARRAY['image/jpeg', 'image/webp'])
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

-- 4. Images d'en-tête des pages (vide au départ)
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('page_heroes', '{}', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 4 bis. Textes de la page /galerie (créés seulement s'ils n'existent pas)
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('galerie_page', $t${"kicker": "Galerie", "title": "Les coulisses,", "titleAccent": "en images.", "lead": "Événements, formations et coulisses : les photos de nos tournages, album par album.", "emptyTitle": "Les premiers albums arrivent bientôt.", "emptyText": "En attendant, parlons de votre événement : il pourrait être le prochain album."}$t$, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 5. Titres de la bande Galerie de l'accueil, ajoutés à home_sections
--    seulement s'ils manquent (les valeurs existantes gardent la priorité)
UPDATE "Setting"
SET "value" = (
      jsonb_build_object(
        'galleryKicker', 'Galerie',
        'galleryTitle', 'Dans les coulisses',
        'galleryTitleAccent', 'du direct.'
      ) || "value"::jsonb
    )::text,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'home_sections'
  AND NOT ("value"::jsonb ? 'galleryTitle');

-- 6. Les numéros de scène sont calculés par le site : retrait du préfixe
--    « Scène NN · » des chapeaux (kicker) des pages, texte restant inchangé
UPDATE "Setting"
SET "value" = regexp_replace("value", '("kicker"\s*:\s*")Sc[eè]ne\s+[0-9]+\s*·\s*', '\1'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" IN ('contact_page', 'portfolio_page', 'about_page', 'services_page', 'formations_page')
  AND "value" ~ '"kicker"\s*:\s*"Sc[eè]ne\s+[0-9]+\s*·';
