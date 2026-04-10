-- Optional cover image path inside Storage bucket `project-images` (not a full URL).
alter table public.projects
  add column if not exists representative_image_path text;

-- Free-text skills the inventor needs (name + short description) for Idea Arena display.
create table if not exists public.project_required_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_name text not null,
  skill_description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_required_skills_project_id_idx
  on public.project_required_skills (project_id);

alter table public.project_required_skills enable row level security;

-- Public bucket for representative images; uploads use service role (bypasses RLS).
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read project images" on storage.objects;

create policy "Public read project images"
on storage.objects for select
using (bucket_id = 'project-images');
