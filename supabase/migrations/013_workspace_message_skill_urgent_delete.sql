alter table public.project_workspace_messages
  add column if not exists job_category text null,
  add column if not exists is_urgent boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_clerk_user_id text null;

create index if not exists project_workspace_messages_project_board_created_idx
  on public.project_workspace_messages (project_id, job_category, created_at)
  where deleted_at is null;
