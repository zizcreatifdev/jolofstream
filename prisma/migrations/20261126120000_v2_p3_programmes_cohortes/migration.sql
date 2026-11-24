-- Refonte V2, prompt 3 : formations en programmes et cohortes
-- Migration additive (aucune table ni colonne supprimee), idempotente :
-- peut etre executee plusieurs fois dans l'editeur SQL Supabase.

-- 1. Table des programmes
CREATE TABLE IF NOT EXISTS "TrainingProgram" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "disciplines" TEXT[],
    "sessionsCount" INTEGER,
    "theoryHours" INTEGER,
    "practiceHours" INTEGER,
    "level" TEXT,
    "audience" TEXT,
    "objectives" TEXT[],
    "curriculum" JSONB,
    "stats" JSONB,
    "leadName" TEXT,
    "leadRole" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "defaultPrice" DOUBLE PRECISION,
    "defaultMaxSeats" INTEGER,
    "brochureUrl" TEXT,
    "brochurePath" TEXT,
    "brochureTitle" TEXT,
    "brochureFileName" TEXT,
    "brochureSize" INTEGER,
    "brochurePages" INTEGER,
    "brochureUpdatedAt" TIMESTAMP(3),
    "brochurePublished" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrainingProgram_slug_key" ON "TrainingProgram"("slug");

-- 2. Colonnes ajoutees aux tables existantes
ALTER TABLE "TrainingSession" ADD COLUMN IF NOT EXISTS "programId" TEXT;
ALTER TABLE "TrainingSession" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "TrainingSession" ADD COLUMN IF NOT EXISTS "scheduleText" TEXT;
ALTER TABLE "TrainingRegistration" ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMP(3);
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "programId" TEXT;

-- 3. Slug ASCII (fonction temporaire de la session, rien n'est cree en base ;
--    translate() remplace les accents, sans dependre de l'extension unaccent)
CREATE OR REPLACE FUNCTION pg_temp.jolof_slug(input text) RETURNS text
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT COALESCE(
    NULLIF(
      btrim(
        regexp_replace(
          translate(replace(replace(lower(input), 'œ', 'oe'), 'æ', 'ae'),
            'àâäáãåāçéèêëēíìîïīñóòôöõøōúùûüūýÿ', 'aaaaaaaceeeeeiiiiinooooooouuuuuyy'),
          '[^a-z0-9]+', '-', 'g'),
        '-'),
      ''),
    'formation')
$fn$;

-- 4. Un programme par titre de session distinct (espaces et casse normalises),
--    identifiant deterministe, slug unique (suffixe -2, -3 si collision),
--    puis rattachement des sessions
DO $$
DECLARE
  g RECORD;
  pid text;
  base text;
  candidate text;
  n int;
BEGIN
  FOR g IN
    SELECT
      lower(regexp_replace(btrim(s."title"), '\s+', ' ', 'g')) AS norm,
      (array_agg(regexp_replace(btrim(s."title"), '\s+', ' ', 'g')
        ORDER BY s."createdAt", s."id"))[1] AS name,
      min(COALESCE(s."dateStart", s."createdAt")) AS first_date
    FROM "TrainingSession" s
    WHERE s."programId" IS NULL
    GROUP BY 1
    ORDER BY 3, 1
  LOOP
    pid := 'prog_' || substr(md5(g.norm), 1, 24);
    IF NOT EXISTS (SELECT 1 FROM "TrainingProgram" WHERE "id" = pid) THEN
      base := pg_temp.jolof_slug(g.name);
      candidate := base;
      n := 1;
      WHILE EXISTS (SELECT 1 FROM "TrainingProgram" WHERE "slug" = candidate) LOOP
        n := n + 1;
        candidate := base || '-' || n;
      END LOOP;
      INSERT INTO "TrainingProgram" (
        "id", "slug", "name", "disciplines", "objectives", "published", "order", "updatedAt"
      ) VALUES (
        pid, candidate, g.name, '{}', '{}', true,
        (SELECT COALESCE(max("order"), -1) + 1 FROM "TrainingProgram"),
        CURRENT_TIMESTAMP
      );
    END IF;
    UPDATE "TrainingSession"
    SET "programId" = pid
    WHERE "programId" IS NULL
      AND lower(regexp_replace(btrim("title"), '\s+', ' ', 'g')) = g.norm;
  END LOOP;
END $$;

-- 5. programId obligatoire, cles etrangeres (suppression d'un programme avec
--    cohortes refusee ; temoignage detache si son programme est supprime)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "TrainingSession" WHERE "programId" IS NULL) THEN
    ALTER TABLE "TrainingSession" ALTER COLUMN "programId" SET NOT NULL;
  ELSE
    RAISE NOTICE 'Sessions sans programme : programId laisse facultatif.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrainingSession_programId_fkey') THEN
    ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_programId_fkey"
      FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Testimonial_programId_fkey') THEN
    ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_programId_fkey"
      FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TrainingSession_programId_idx" ON "TrainingSession"("programId");
CREATE INDEX IF NOT EXISTS "Testimonial_programId_idx" ON "Testimonial"("programId");

-- 6. Delai de paiement des reservations en attente existantes : 48 h
UPDATE "TrainingRegistration"
SET "holdExpiresAt" = "registeredAt" + interval '48 hours'
WHERE "status" = 'en_attente' AND "holdExpiresAt" IS NULL;

-- 7. Parametre du delai de paiement (heures, entre 24 et 168)
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('training_payment_delay_hours', '48', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 8. Fiche RMPD, jamais d'ecrasement : aucun programme, creation ; un seul,
--    remplissage des champs vides ; plusieurs, rien (avis avec la liste)
DO $$
DECLARE
  nb int;
BEGIN
  SELECT count(*) INTO nb FROM "TrainingProgram";
  IF nb = 0 THEN
    INSERT INTO "TrainingProgram" (
      "id", "slug", "code", "name", "tagline", "description", "disciplines",
      "sessionsCount", "theoryHours", "practiceHours", "level", "audience",
      "objectives", "curriculum", "stats", "leadName", "leadRole",
      "contactEmail", "contactPhone", "brochureTitle", "brochureFileName",
      "published", "order", "updatedAt"
    ) VALUES (
      'prog_rmpd', $q$rmpd$q$, $q$F-RMPD$q$, $q$Réalisation multicam$q$, $q$De la théorie à la régie.$q$,
      $q$Une seule inscription pour trois disciplines : la réalisation, le cadrage et le son. Vous découvrez les outils, vous les manipulez, puis vous réalisez un mini live en conditions réelles.$q$,
      ARRAY[$q$Réalisation$q$, $q$Cadrage$q$, $q$Son$q$]::text[],
      5, 4, 12, $q$Aucun prérequis$q$,
      $q$Étudiants, passionnés d'audiovisuel, créateurs de contenus. Aucune expérience requise.$q$,
      ARRAY[$q$Comprendre les principes et enjeux de la production audiovisuelle en direct$q$, $q$Utiliser les équipements de captation multicaméra et de régie$q$, $q$Concevoir et préparer un événement ou une émission en direct$q$, $q$Réaliser en équipe une captation live diffusée sur plusieurs plateformes$q$, $q$Assurer la post-production et valoriser les contenus diffusés$q$]::text[],
      $json$[{"title": "Découvrir la réalisation multicam", "mode": "100 % théorique", "content": ["Introduction au live streaming et aux formats de direct (plateau, concert, événement)", "Présentation du matériel et des connectiques", "Démonstration en plateau test"]}, {"title": "Préparer un direct", "mode": "Atelier pratique en équipe", "content": ["Plan de captation, storyboard, repérage du lieu", "Préparation de la communication inter-équipe (talkie, signal, rôles)", "Atelier : créer le plan technique d'un mini-live"]}, {"title": "Régie et outils de diffusion", "mode": "Pratique guidée sur poste", "content": ["Installation et configuration du logiciel de régie (OBS, vMix ou ATEM)", "Prise en main des transitions, lower thirds, mixage audio", "Simulation d'un live avec caméras, diffusion sur YouTube ou Facebook Live"]}, {"title": "Production pratique : captation simple", "mode": "Projet de groupe encadré", "content": ["Répartition des rôles (réalisateur, cadreur, technicien son, habillage)", "Captation d'une interview, d'un plateau ou d'une performance", "Débrief technique à chaud"]}, {"title": "Production pratique : mini live", "mode": "Projet de groupe encadré", "content": ["Réalisation d'un mini live en conditions réelles", "Débrief technique à chaud"]}]$json$::jsonb,
      $json$[{"value": "06", "label": "cohortes réalisées"}, {"value": "90", "label": "personnes formées"}, {"value": "+80 %", "label": "ont déjà participé à une production multicam"}]$json$::jsonb,
      $q$Serigne Khadim Diouf$q$, $q$Réalisateur multicam, à l'initiative de la formation$q$,
      $q$formation@jolofstream.com$q$, $q$+221 78 241 49 49$q$,
      $q$La formation RMPD$q$, $q$Jolof-Stream-Formation-RMPD.pdf$q$,
      true, 0, CURRENT_TIMESTAMP
    );
  ELSIF nb = 1 THEN
    UPDATE "TrainingProgram" SET
      "code" = COALESCE(NULLIF("code", ''), $q$F-RMPD$q$),
      "tagline" = COALESCE(NULLIF("tagline", ''), $q$De la théorie à la régie.$q$),
      "description" = COALESCE(NULLIF("description", ''), $q$Une seule inscription pour trois disciplines : la réalisation, le cadrage et le son. Vous découvrez les outils, vous les manipulez, puis vous réalisez un mini live en conditions réelles.$q$),
      "disciplines" = CASE WHEN COALESCE(cardinality("disciplines"), 0) = 0
        THEN ARRAY[$q$Réalisation$q$, $q$Cadrage$q$, $q$Son$q$]::text[] ELSE "disciplines" END,
      "sessionsCount" = COALESCE("sessionsCount", 5),
      "theoryHours" = COALESCE("theoryHours", 4),
      "practiceHours" = COALESCE("practiceHours", 12),
      "level" = COALESCE(NULLIF("level", ''), $q$Aucun prérequis$q$),
      "audience" = COALESCE(NULLIF("audience", ''), $q$Étudiants, passionnés d'audiovisuel, créateurs de contenus. Aucune expérience requise.$q$),
      "objectives" = CASE WHEN COALESCE(cardinality("objectives"), 0) = 0
        THEN ARRAY[$q$Comprendre les principes et enjeux de la production audiovisuelle en direct$q$, $q$Utiliser les équipements de captation multicaméra et de régie$q$, $q$Concevoir et préparer un événement ou une émission en direct$q$, $q$Réaliser en équipe une captation live diffusée sur plusieurs plateformes$q$, $q$Assurer la post-production et valoriser les contenus diffusés$q$]::text[] ELSE "objectives" END,
      "curriculum" = COALESCE(NULLIF("curriculum", '[]'::jsonb), $json$[{"title": "Découvrir la réalisation multicam", "mode": "100 % théorique", "content": ["Introduction au live streaming et aux formats de direct (plateau, concert, événement)", "Présentation du matériel et des connectiques", "Démonstration en plateau test"]}, {"title": "Préparer un direct", "mode": "Atelier pratique en équipe", "content": ["Plan de captation, storyboard, repérage du lieu", "Préparation de la communication inter-équipe (talkie, signal, rôles)", "Atelier : créer le plan technique d'un mini-live"]}, {"title": "Régie et outils de diffusion", "mode": "Pratique guidée sur poste", "content": ["Installation et configuration du logiciel de régie (OBS, vMix ou ATEM)", "Prise en main des transitions, lower thirds, mixage audio", "Simulation d'un live avec caméras, diffusion sur YouTube ou Facebook Live"]}, {"title": "Production pratique : captation simple", "mode": "Projet de groupe encadré", "content": ["Répartition des rôles (réalisateur, cadreur, technicien son, habillage)", "Captation d'une interview, d'un plateau ou d'une performance", "Débrief technique à chaud"]}, {"title": "Production pratique : mini live", "mode": "Projet de groupe encadré", "content": ["Réalisation d'un mini live en conditions réelles", "Débrief technique à chaud"]}]$json$::jsonb),
      "stats" = COALESCE(NULLIF("stats", '[]'::jsonb), $json$[{"value": "06", "label": "cohortes réalisées"}, {"value": "90", "label": "personnes formées"}, {"value": "+80 %", "label": "ont déjà participé à une production multicam"}]$json$::jsonb),
      "leadName" = COALESCE(NULLIF("leadName", ''), $q$Serigne Khadim Diouf$q$),
      "leadRole" = COALESCE(NULLIF("leadRole", ''), $q$Réalisateur multicam, à l'initiative de la formation$q$),
      "contactEmail" = COALESCE(NULLIF("contactEmail", ''), $q$formation@jolofstream.com$q$),
      "contactPhone" = COALESCE(NULLIF("contactPhone", ''), $q$+221 78 241 49 49$q$),
      "brochureTitle" = COALESCE(NULLIF("brochureTitle", ''), $q$La formation RMPD$q$),
      "brochureFileName" = COALESCE(NULLIF("brochureFileName", ''), $q$Jolof-Stream-Formation-RMPD.pdf$q$);
  ELSE
    RAISE NOTICE 'Plusieurs programmes, fiche RMPD non remplie : %',
      (SELECT string_agg("name" || ' [' || "slug" || ']', ', ' ORDER BY "order") FROM "TrainingProgram");
  END IF;
END $$;

-- 9. Parcours d'anciens du prompt 2 rattaches au programme RMPD
UPDATE "Testimonial"
SET "programId" = (
  SELECT "id" FROM "TrainingProgram"
  WHERE "code" = 'F-RMPD' OR "slug" = 'rmpd'
  ORDER BY ("code" = 'F-RMPD') DESC NULLS LAST, "order"
  LIMIT 1
)
WHERE "id" LIKE 'tm\_alumni\_%'
  AND "programId" IS NULL
  AND EXISTS (SELECT 1 FROM "TrainingProgram" WHERE "code" = 'F-RMPD' OR "slug" = 'rmpd');

-- 10. Bucket Supabase Storage "formations" (public) : plaquettes PDF,
--     10 Mo maximum. Ignore hors Supabase (schema storage absent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('formations', 'formations', true, 10485760, ARRAY['application/pdf'])
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
