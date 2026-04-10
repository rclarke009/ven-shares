-- Professionals who joined a project (Idea Arena). Access only via server-side service role.
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  clerk_user_id text not null,
  created_at timestamptz not null default now(),
  unique (project_id, clerk_user_id)
);

create index if not exists project_members_project_id_idx
  on public.project_members (project_id);

create index if not exists project_members_clerk_user_id_idx
  on public.project_members (clerk_user_id);

alter table public.project_members enable row level security;

-- No policies: anon/authenticated cannot read/write; server uses service role (bypasses RLS).
