-- Skills the inventor needs on the team (same labels as professional job categories).
alter table public.projects
  add column if not exists required_job_categories text[] not null default '{}';
