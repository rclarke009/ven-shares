-- Team workspace: files metadata, messages, activity feed, presence.
-- RLS enabled, no policies (server service role only), matching projects pattern.

create table if not exists public.project_workspace_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by_clerk_user_id text not null,
  storage_path text not null,
  filename text not null,
  content_type text,
  byte_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_workspace_files_project_created_idx
  on public.project_workspace_files (project_id, created_at desc);

alter table public.project_workspace_files enable row level security;

create table if not exists public.project_workspace_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_clerk_user_id text not null,
  body text not null,
  reply_to_id uuid references public.project_workspace_messages (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_workspace_messages_project_created_idx
  on public.project_workspace_messages (project_id, created_at desc);

alter table public.project_workspace_messages enable row level security;

create table if not exists public.project_workspace_activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_clerk_user_id text not null,
  kind text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_workspace_activities_project_created_idx
  on public.project_workspace_activities (project_id, created_at desc);

alter table public.project_workspace_activities enable row level security;

create table if not exists public.project_workspace_presence (
  project_id uuid not null references public.projects (id) on delete cascade,
  clerk_user_id text not null,
  status_text text not null default '',
  updated_at timestamptz not null default now(),
  primary key (project_id, clerk_user_id)
);

create index if not exists project_workspace_presence_project_idx
  on public.project_workspace_presence (project_id);

alter table public.project_workspace_presence enable row level security;

-- Private bucket: no public read policy; app uses signed URLs after access check.
insert into storage.buckets (id, name, public)
values ('project-workspace-files', 'project-workspace-files', false)
on conflict (id) do nothing;
