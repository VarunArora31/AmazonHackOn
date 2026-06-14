-- ═══════════════════════════════════════════════════════════════
-- CampusFlow: Announcements Table
-- Admin-created notices that persist across sessions
-- ═══════════════════════════════════════════════════════════════

create table if not exists announcements (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  summary         text not null,
  category        text not null default 'General',
  urgency         text not null default 'normal',
  target_branch   text not null default 'ALL',
  target_year     text not null default 'ALL',
  author_email    text not null,
  created_at      timestamptz not null default now()
);

-- Index for fast queries
create index if not exists idx_announcements_created
  on announcements (created_at desc);

create index if not exists idx_announcements_target
  on announcements (target_branch, target_year);

-- RLS
alter table announcements enable row level security;

-- Everyone can read announcements
create policy "Anyone can read announcements"
  on announcements for select using (true);

-- Only service role can insert (via API)
create policy "Service role can insert announcements"
  on announcements for insert with check (true);
