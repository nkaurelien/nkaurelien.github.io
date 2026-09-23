-- Schéma Postgres + pgvector du RAG (Neon en production, Docker en local).
-- Idempotent : make db-schema, ou monté dans /docker-entrypoint-initdb.d.

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create ContentSection table
create table if not exists public.content_sections (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null check (category in ('ABOUT', 'PROJECT', 'EXPERIENCE')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Une seule section par catégorie -> rend l'ingestion (ON CONFLICT) idempotente
  constraint content_sections_category_key unique (category)
);

-- Create ContentEntry table
create table if not exists public.content_entries (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  raw_markdown text not null,
  publish_date date,
  section_id uuid not null references public.content_sections(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create VectorEmbedding table
-- We use size 384 for the Xenova/all-MiniLM-L6-v2 local model.
-- Change size to 1536 if migrating to OpenAI text-embedding-3-small.
create table if not exists public.vector_embeddings (
  id uuid default gen_random_uuid() primary key,
  text_chunk text not null,
  embedding_vector vector(384) not null,
  content_entry_id uuid not null references public.content_entries(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Tag table
create table if not exists public.tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color_code text
);

-- Create ContentTag table (Many-to-Many)
create table if not exists public.content_tags (
  content_entry_id uuid references public.content_entries(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (content_entry_id, tag_id)
);

-- Pas de RLS : l'accès se fait en SQL direct (pg / Prisma) avec le rôle
-- propriétaire, sans API REST publique (ancien schéma Supabase : anon/authenticated).

-- Create cosine similarity search function for semantic search queries
create or replace function match_embeddings(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content_entry_id uuid,
  text_chunk text,
  similarity float
)
language sql stable
as $$
  select
    vector_embeddings.id,
    vector_embeddings.content_entry_id,
    vector_embeddings.text_chunk,
    1 - (vector_embeddings.embedding_vector <=> query_embedding) as similarity
  from vector_embeddings
  where 1 - (vector_embeddings.embedding_vector <=> query_embedding) > match_threshold
  order by vector_embeddings.embedding_vector <=> query_embedding
  limit match_count;
$$;
