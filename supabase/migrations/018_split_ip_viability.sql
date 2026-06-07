-- Split legacy "Patent / IP (intellectual property) law" into IP and Viability skills.

update public.projects
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP (intellectual property) law'
          then array['IP - Trademarks, Patents', 'Viability']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Patent / IP (intellectual property) law' = any (required_job_categories);

update public.projects
set completed_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP (intellectual property) law'
          then array['IP - Trademarks, Patents']
        else array[elem]
      end
    ) as elem
    from unnest(completed_job_categories) as elem
  ) s
)
where 'Patent / IP (intellectual property) law' = any (completed_job_categories);

update public.project_members
set covered_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP (intellectual property) law'
          then array['IP - Trademarks, Patents']
        else array[elem]
      end
    ) as elem
    from unnest(covered_job_categories) as elem
  ) s
)
where 'Patent / IP (intellectual property) law' = any (covered_job_categories);

update public.projects
set workspace_progress_checklist =
  (workspace_progress_checklist - 'Patent / IP (intellectual property) law')
  || jsonb_build_object(
    'IP - Trademarks, Patents',
    workspace_progress_checklist->'Patent / IP (intellectual property) law'
  )
where workspace_progress_checklist ? 'Patent / IP (intellectual property) law';

update public.project_templates
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Patent / IP (intellectual property) law'
          then array['IP - Trademarks, Patents', 'Viability']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Patent / IP (intellectual property) law' = any (required_job_categories);

update public.project_templates
set checklist_definition =
  (checklist_definition - 'Patent / IP (intellectual property) law')
  || jsonb_build_object(
    'IP - Trademarks, Patents',
    checklist_definition->'Patent / IP (intellectual property) law'
  )
where checklist_definition ? 'Patent / IP (intellectual property) law';
