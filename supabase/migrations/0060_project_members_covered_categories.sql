-- Categories this member was contributing at join time (intersection with project.required_job_categories).
alter table public.project_members
  add column if not exists covered_job_categories text[] not null default '{}';
