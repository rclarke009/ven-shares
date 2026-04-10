-- Per–job-category workspace checklist (standard + custom majors/minors); synced to completed_job_categories for arena cards.
alter table public.projects
  add column if not exists workspace_progress_checklist jsonb not null default '{}'::jsonb;
