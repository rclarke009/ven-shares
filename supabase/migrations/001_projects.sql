-- Projects created by inventors (Clerk user id). Access only via server-side service role.
-- If `projects` already exists with the wrong columns, run 002_projects_dev_reset.sql
-- in dev (drops and recreates the table).
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  clerk_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_clerk_user_id_idx on public.projects (clerk_user_id);

alter table public.projects enable row level security;

-- No policies: anon/authenticated cannot read/write; server uses service role (bypasses RLS).
