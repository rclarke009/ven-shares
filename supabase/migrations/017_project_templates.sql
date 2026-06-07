-- Business project templates (admin-managed checklists + dependency defaults).

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  required_job_categories text[] not null default '{}',
  checklist_definition jsonb not null default '{}',
  dependency_overrides jsonb not null default '{}',
  suggested_skills jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_clerk_user_id text
);

create index if not exists project_templates_published_sort_idx
  on public.project_templates (is_published, sort_order, name);

alter table public.projects
  add column if not exists template_id uuid references public.project_templates (id) on delete set null;

create index if not exists projects_template_id_idx on public.projects (template_id);

alter table public.project_templates enable row level security;
-- Server uses service role (bypasses RLS).
