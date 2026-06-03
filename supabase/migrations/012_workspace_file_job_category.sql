alter table public.project_workspace_files
  add column if not exists job_category text null;

create index if not exists project_workspace_files_project_category_idx
  on public.project_workspace_files (project_id, job_category, created_at desc)
  where deleted_at is null;
