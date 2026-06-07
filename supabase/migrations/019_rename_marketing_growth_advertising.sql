-- Rename "Marketing / growth" preset to "Marketing / growth / advertising".

update public.projects
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Marketing / growth'
          then array['Marketing / growth / advertising']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Marketing / growth' = any (required_job_categories);

update public.projects
set completed_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Marketing / growth'
          then array['Marketing / growth / advertising']
        else array[elem]
      end
    ) as elem
    from unnest(completed_job_categories) as elem
  ) s
)
where 'Marketing / growth' = any (completed_job_categories);

update public.project_members
set covered_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Marketing / growth'
          then array['Marketing / growth / advertising']
        else array[elem]
      end
    ) as elem
    from unnest(covered_job_categories) as elem
  ) s
)
where 'Marketing / growth' = any (covered_job_categories);

update public.projects
set workspace_progress_checklist =
  (workspace_progress_checklist - 'Marketing / growth')
  || jsonb_build_object(
    'Marketing / growth / advertising',
    workspace_progress_checklist->'Marketing / growth'
  )
where workspace_progress_checklist ? 'Marketing / growth';

update public.project_templates
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Marketing / growth'
          then array['Marketing / growth / advertising']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Marketing / growth' = any (required_job_categories);

update public.project_templates
set checklist_definition =
  (checklist_definition - 'Marketing / growth')
  || jsonb_build_object(
    'Marketing / growth / advertising',
    checklist_definition->'Marketing / growth'
  )
where checklist_definition ? 'Marketing / growth';

update public.project_workspace_files
set job_category = 'Marketing / growth / advertising'
where job_category = 'Marketing / growth';

update public.project_workspace_messages
set job_category = 'Marketing / growth / advertising'
where job_category = 'Marketing / growth';
