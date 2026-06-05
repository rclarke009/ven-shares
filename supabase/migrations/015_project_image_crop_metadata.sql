-- Full-resolution originals and crop metadata for arena card / hero image editors.
alter table public.projects
  add column if not exists representative_image_original_path text,
  add column if not exists representative_image_crop jsonb,
  add column if not exists hero_image_original_path text,
  add column if not exists hero_image_crop jsonb;
