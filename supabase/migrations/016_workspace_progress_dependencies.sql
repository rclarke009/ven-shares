-- Milestone completion + optional dependency overrides for unified progress graph.
alter table public.projects
  add column if not exists workspace_progress_dependencies jsonb not null default '{}'::jsonb;
