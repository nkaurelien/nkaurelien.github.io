-- Déduplication de public.content_sections + contrainte d'unicité sur category.
--
-- Contexte : le script d'ingestion faisait `INSERT ... ON CONFLICT DO NOTHING`
-- sans contrainte unique, donc chaque exécution créait une section en double.
-- Ce script :
--   1. repointe les content_entries vers la section canonique (la plus ancienne
--      par catégorie),
--   2. supprime les sections en double,
--   3. ajoute UNIQUE(category) pour rendre l'ingestion réellement idempotente.
--
-- À exécuter UNE FOIS dans le SQL Editor de Supabase. Transactionnel & ré-exécutable.

BEGIN;

-- 1. Mapping : chaque section -> section canonique (la plus ancienne de sa catégorie)
CREATE TEMP TABLE section_dedup ON COMMIT DROP AS
SELECT
  id,
  first_value(id) OVER (
    PARTITION BY category
    ORDER BY created_at ASC, id ASC
  ) AS canonical_id
FROM public.content_sections;

-- 2. Repointer les entries des sections en double vers la canonique
UPDATE public.content_entries ce
SET section_id = sd.canonical_id
FROM section_dedup sd
WHERE ce.section_id = sd.id
  AND sd.id <> sd.canonical_id;

-- 3. Supprimer les sections en double (celles qui ne sont pas canoniques)
DELETE FROM public.content_sections
WHERE id IN (
  SELECT id FROM section_dedup WHERE id <> canonical_id
);

-- 4. Ajouter la contrainte d'unicité (guardée pour être ré-exécutable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_sections_category_key'
  ) THEN
    ALTER TABLE public.content_sections
      ADD CONSTRAINT content_sections_category_key UNIQUE (category);
  END IF;
END $$;

COMMIT;

-- Vérification (doit renvoyer 1 ligne par catégorie) :
--   SELECT category, count(*) FROM public.content_sections GROUP BY category;
