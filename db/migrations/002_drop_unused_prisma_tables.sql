-- 002 : suppression des tables Prisma en CamelCase, vides et inutilisées.
--
-- Vestiges d'un ancien schéma Prisma (le RAG utilise les tables snake_case).
-- Garde-fou : la migration échoue si l'une d'elles contient des lignes.
-- Après application : `npx prisma db pull` puis `npx prisma generate` pour
-- retirer ces modèles de prisma/schema.prisma (sinon `prisma db push` les recréerait).

BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  t text;
  n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY['VectorEmbedding', 'ContentTag', 'ContentEntry', 'ContentSection', 'Tag', 'Profile'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      IF n > 0 THEN
        RAISE EXCEPTION 'Table "%" non vide (% lignes) : suppression annulée', t, n;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Ordre : tables filles d'abord (clés étrangères).
DROP TABLE IF EXISTS "VectorEmbedding";
DROP TABLE IF EXISTS "ContentTag";
DROP TABLE IF EXISTS "ContentEntry";
DROP TABLE IF EXISTS "ContentSection";
DROP TABLE IF EXISTS "Tag";
DROP TABLE IF EXISTS "Profile";

INSERT INTO schema_migrations (version) VALUES ('002') ON CONFLICT DO NOTHING;

COMMIT;
