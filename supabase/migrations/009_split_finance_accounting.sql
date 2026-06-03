-- Split legacy combined "Finance / accounting" into separate Finance and Accounting presets.

update public.projects
set required_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Finance / accounting' then array['Finance', 'Accounting']
        else array[elem]
      end
    ) as elem
    from unnest(required_job_categories) as elem
  ) s
)
where 'Finance / accounting' = any (required_job_categories);

update public.projects
set completed_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Finance / accounting' then array['Finance', 'Accounting']
        else array[elem]
      end
    ) as elem
    from unnest(completed_job_categories) as elem
  ) s
)
where 'Finance / accounting' = any (completed_job_categories);

update public.project_members
set covered_job_categories = (
  select coalesce(array_agg(distinct elem order by elem), '{}')
  from (
    select unnest(
      case
        when elem = 'Finance / accounting' then array['Finance', 'Accounting']
        else array[elem]
      end
    ) as elem
    from unnest(covered_job_categories) as elem
  ) s
)
where 'Finance / accounting' = any (covered_job_categories);

update public.projects
set workspace_progress_checklist =
  (workspace_progress_checklist - 'Finance / accounting')
where workspace_progress_checklist ? 'Finance / accounting';
