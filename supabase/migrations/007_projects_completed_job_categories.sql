-- Job categories the team marked complete (no longer recruiting for that slot).
alter table public.projects
  add column if not exists completed_job_categories text[] not null default '{}';
