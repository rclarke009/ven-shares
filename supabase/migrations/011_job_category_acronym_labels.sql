-- Rename job category preset labels that now include acronym definitions.

update public.projects
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP law'
          then array['Patent / IP (intellectual property) law']
        when elem = 'Design / UX'
          then array['Design / UX (user experience)']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Patent / IP law' = any (required_job_categories)
   or 'Design / UX' = any (required_job_categories);

update public.projects
set completed_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP law'
          then array['Patent / IP (intellectual property) law']
        when elem = 'Design / UX'
          then array['Design / UX (user experience)']
        else array[elem]
      end
    ) as elem
    from unnest(completed_job_categories) as elem
  ) s
)
where 'Patent / IP law' = any (completed_job_categories)
   or 'Design / UX' = any (completed_job_categories);

update public.project_members
set covered_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP law'
          then array['Patent / IP (intellectual property) law']
        when elem = 'Design / UX'
          then array['Design / UX (user experience)']
        else array[elem]
      end
    ) as elem
    from unnest(covered_job_categories) as elem
  ) s
)
where 'Patent / IP law' = any (covered_job_categories)
   or 'Design / UX' = any (covered_job_categories);

update public.projects
set workspace_progress_checklist =
  (workspace_progress_checklist - 'Patent / IP law')
  || jsonb_build_object(
    'Patent / IP (intellectual property) law',
    workspace_progress_checklist->'Patent / IP law'
  )
where workspace_progress_checklist ? 'Patent / IP law';

update public.projects
set workspace_progress_checklist =
  (workspace_progress_checklist - 'Design / UX')
  || jsonb_build_object(
    'Design / UX (user experience)',
    workspace_progress_checklist->'Design / UX'
  )
where workspace_progress_checklist ? 'Design / UX';
