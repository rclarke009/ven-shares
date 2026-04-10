-- Dev only: fixes a partial / wrong `projects` shape (e.g. table created without
-- clerk_user_id because CREATE TABLE IF NOT EXISTS skipped the full definition).
-- Destroys existing rows in public.projects. Safe while you have no prod data.
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  clerk_user_id text not null,
  required_job_categories text[] not null default '{}',
  representative_image_path text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS projects_clerk_user_id_idx ON public.projects (clerk_user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_required_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_name text not null,
  skill_description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS project_required_skills_project_id_idx
  ON public.project_required_skills (project_id);

ALTER TABLE public.project_required_skills ENABLE ROW LEVEL SECURITY;
