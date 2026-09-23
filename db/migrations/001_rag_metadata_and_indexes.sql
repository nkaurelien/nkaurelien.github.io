-- 001 : métadonnées des extraits, traçabilité du modèle, hash de contenu, index.
--
-- Non destructive et rétrocompatible : le code actuel (rag.js -> match_embeddings,
-- scripts/import-projects.js) continue de fonctionner tel quel. Idempotente :
-- peut être rejouée sans effet. Appliquer avec `make db-migrate`.
--
-- Inspirée du modèle de litellm-pgvector (métadonnées jsonb filtrables, collections
-- libres), en gardant notre modèle document -> extraits (source conservée, slug unique).

BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- 1. Collections libres : la liste figée ABOUT|PROJECT|EXPERIENCE devient un format.
--    (UNIQUE(category) est conservé : l'ingestion s'appuie dessus via ON CONFLICT.)
ALTER TABLE content_sections DROP CONSTRAINT IF EXISTS content_sections_category_check;
ALTER TABLE content_sections DROP CONSTRAINT IF EXISTS content_sections_category_format;
ALTER TABLE content_sections
  ADD CONSTRAINT content_sections_category_format CHECK (category ~ '^[A-Z][A-Z0-9_]*$');

-- 2. Hash du document source, maintenu automatiquement (colonne générée) : permet de ne
--    réembedder que les documents modifiés. Même valeur qu'un sha256 UTF-8 côté Node :
--    crypto.createHash('sha256').update(raw_markdown, 'utf8').digest('hex').
--    convert_to() est STABLE ; l'encodage cible étant fixe, l'enveloppe est IMMUTABLE.
CREATE OR REPLACE FUNCTION content_sha256(input text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT encode(sha256(convert_to(input, 'UTF8')), 'hex') $$;

ALTER TABLE content_entries
  ADD COLUMN IF NOT EXISTS content_hash text
  GENERATED ALWAYS AS (content_sha256(raw_markdown)) STORED;

-- 3. Extraits : métadonnées filtrables, modèle d'embedding, position dans le document.
ALTER TABLE vector_embeddings ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE vector_embeddings
  ADD COLUMN IF NOT EXISTS embedding_model text NOT NULL DEFAULT 'Xenova/all-MiniLM-L6-v2';
ALTER TABLE vector_embeddings ADD COLUMN IF NOT EXISTS chunk_index integer;

-- Rétro-remplissage (uniquement les lignes pas encore renseignées).
UPDATE vector_embeddings v
   SET metadata = jsonb_build_object('slug', e.slug, 'category', s.category) || v.metadata
  FROM content_entries e
  JOIN content_sections s ON s.id = e.section_id
 WHERE e.id = v.content_entry_id
   AND NOT (v.metadata ? 'slug');

-- L'ingestion insère les extraits dans l'ordre, un par requête : created_at donne l'ordre.
UPDATE vector_embeddings v
   SET chunk_index = o.idx
  FROM (SELECT id, row_number() OVER (PARTITION BY content_entry_id ORDER BY created_at, id) - 1 AS idx
          FROM vector_embeddings) o
 WHERE o.id = v.id
   AND v.chunk_index IS NULL;

-- 4. Index manquants.
CREATE INDEX IF NOT EXISTS vector_embeddings_content_entry_id_idx ON vector_embeddings (content_entry_id);
CREATE INDEX IF NOT EXISTS content_tags_tag_id_idx ON content_tags (tag_id);
CREATE INDEX IF NOT EXISTS vector_embeddings_metadata_idx ON vector_embeddings USING gin (metadata jsonb_path_ops);
-- HNSW (distance cosinus, comme <=> dans les requêtes) : recherche approximative,
-- utile au-delà de quelques milliers d'extraits ; sans effet négatif en dessous.
CREATE INDEX IF NOT EXISTS vector_embeddings_embedding_hnsw_idx
  ON vector_embeddings USING hnsw (embedding_vector vector_cosine_ops);

-- 5. Recherche v2 : filtre sur les métadonnées (@>, servi par l'index GIN) et résultats
--    enrichis. match_embeddings reste inchangée pour le code actuel.
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(384),
  match_count     integer DEFAULT 8,
  match_threshold double precision DEFAULT 0.15,
  filter          jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id               uuid,
  content_entry_id uuid,
  slug             text,
  text_chunk       text,
  metadata         jsonb,
  similarity       double precision
)
LANGUAGE sql STABLE
-- Avec HNSW, le filtre s'applique après la recherche approximative : le scan itératif
-- (pgvector >= 0.8) continue de parcourir l'index jusqu'à obtenir match_count lignes.
SET hnsw.iterative_scan = 'relaxed_order'
AS $$
  SELECT r.id, r.content_entry_id, e.slug, r.text_chunk, r.metadata, r.similarity
    FROM (
      SELECT v.id, v.content_entry_id, v.text_chunk, v.metadata,
             1 - (v.embedding_vector <=> query_embedding) AS similarity
        FROM vector_embeddings v
       WHERE v.metadata @> filter
       ORDER BY v.embedding_vector <=> query_embedding
       LIMIT match_count
    ) r
    JOIN content_entries e ON e.id = r.content_entry_id
   WHERE r.similarity > match_threshold
   ORDER BY r.similarity DESC;
$$;

INSERT INTO schema_migrations (version) VALUES ('001') ON CONFLICT DO NOTHING;

COMMIT;
