-- ═══════════════════════════════════════════════════════════════
-- CampusFlow: Vector RAG Documents Table
-- Stores document chunks with embeddings for semantic search
-- ═══════════════════════════════════════════════════════════════

-- Enable pgvector extension
create extension if not exists vector;

-- Create the documents table with vector column
create table if not exists rag_documents (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  category        text not null default 'general',
  chunk_text      text not null,
  chunk_index     integer not null default 0,
  embedding       vector(384),  -- 384-dim vectors
  metadata        jsonb default '{}',
  user_id         text,          -- per-user knowledge base (null = shared/global)
  created_at      timestamptz not null default now()
);

-- Index for fast vector similarity search
create index if not exists idx_rag_embedding
  on rag_documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- Index for category filtering
create index if not exists idx_rag_category
  on rag_documents (category);

-- Enable RLS
alter table rag_documents enable row level security;

-- Service role full access
create policy "Service role full access on rag_documents"
  on rag_documents for all using (true) with check (true);

-- Function: Similarity search
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  title text,
  category text,
  chunk_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    rag_documents.id,
    rag_documents.title,
    rag_documents.category,
    rag_documents.chunk_text,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  where (filter_category is null or rag_documents.category = filter_category)
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
