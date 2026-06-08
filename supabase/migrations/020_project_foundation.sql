alter table public.projects
  add column if not exists project_foundation jsonb not null default '{}'::jsonb;
