-- ═══════════════════════════════════════════════════════════════
-- CampusFlow: WhatsApp Tasks Table
-- Uses phone_number as the user identifier (no auth system)
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create the whatsapp_tasks table
create table if not exists whatsapp_tasks (
  id              uuid primary key default uuid_generate_v4(),
  phone_number    text not null,
  title           text not null,
  description     text,
  priority        text not null default 'medium'
                    check (priority in ('low', 'medium', 'high')),
  scheduled_time  timestamptz,
  created_at      timestamptz not null default now()
);

-- Index on phone_number for fast lookups per user
create index if not exists idx_whatsapp_tasks_phone
  on whatsapp_tasks (phone_number);

-- Index on scheduled_time for chronological queries
create index if not exists idx_whatsapp_tasks_scheduled
  on whatsapp_tasks (scheduled_time desc nulls last);

-- Enable Row Level Security (locked down by default)
alter table whatsapp_tasks enable row level security;

-- Policy: Service role can do everything (webhook ingestion)
-- No user-facing policies needed since we use service role key
create policy "Service role full access"
  on whatsapp_tasks
  for all
  using (true)
  with check (true);

-- Enable Realtime for this table (broadcasts inserts to frontend)
alter publication supabase_realtime add table whatsapp_tasks;
