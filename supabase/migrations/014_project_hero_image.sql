-- Optional hero banner path inside Storage bucket `project-images` (not a full URL).
alter table public.projects
  add column if not exists hero_image_path text;
