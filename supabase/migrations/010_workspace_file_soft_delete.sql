alter table public.project_workspace_files
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_clerk_user_id text;

create index if not exists project_workspace_files_project_active_idx
  on public.project_workspace_files (project_id, created_at desc)
  where deleted_at is null;
