create index company_jobs_live_created_at_idx
  on public.company_jobs (created_at desc, id desc)
  where status = 'live';

-- Escapes LIKE wildcards so a search for "50%" or "f_b" matches literally.
create function public.like_pattern(term text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '%' || replace(replace(replace(nullif(trim(term), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
$$;

-- titles_only is for guests: matching on designation or company name would
-- reveal those hidden details by elimination.
create function public.live_jobs_matching(
  search_text text,
  place text,
  titles_only boolean
)
returns setof public.company_jobs
language sql
stable
set search_path = ''
as $$
  select j.*
  from public.company_jobs j
  cross join (
    select public.like_pattern(search_text) as q, public.like_pattern(place) as p
  ) f
  where j.status = 'live'
    and (
      f.q is null
      or j.role ilike f.q
      or (
        not titles_only
        and (
          j.designation ilike f.q
          or exists (
            select 1 from public.companies c
            where c.id = j.company_id and c.company_name ilike f.q
          )
        )
      )
    )
    and (f.p is null or j.city ilike f.p or j.pincode ilike f.p);
$$;

-- id breaks ties so rows never shift between pages.
create function public.search_live_jobs(
  search_text text default '',
  place text default '',
  industries text[] default '{}',
  job_types text[] default '{}',
  work_modes text[] default '{}',
  titles_only boolean default false,
  sort_by text default 'recent',
  max_rows integer default 20
)
returns table (
  id uuid,
  slug text,
  industry text,
  role text,
  designation text,
  city text,
  pincode text,
  job_type text,
  work_mode text,
  experience_min smallint,
  experience_max smallint,
  salary_min_lpa numeric,
  salary_max_lpa numeric,
  openings smallint,
  description text,
  responsibilities text[],
  requirements text[],
  benefits text[],
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  company_name text,
  logo_path text,
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    j.id, j.slug, j.industry, j.role, j.designation, j.city, j.pincode,
    j.job_type, j.work_mode, j.experience_min, j.experience_max,
    j.salary_min_lpa, j.salary_max_lpa, j.openings, j.description,
    j.responsibilities, j.requirements, j.benefits, j.status,
    j.created_at, j.updated_at, c.company_name, c.logo_path,
    count(*) over () as total_count
  from public.live_jobs_matching(search_text, place, titles_only) j
  join public.companies c on c.id = j.company_id
  where (cardinality(industries) = 0 or j.industry = any (industries))
    and (cardinality(job_types) = 0 or j.job_type = any (job_types))
    and (cardinality(work_modes) = 0 or j.work_mode = any (work_modes))
  order by
    case when sort_by = 'salary' then j.salary_max_lpa end desc nulls last,
    case when sort_by = 'salary' then j.salary_min_lpa end desc nulls last,
    case when sort_by = 'experience' then j.experience_min end asc nulls last,
    case when sort_by = 'experience' then j.experience_max end asc nulls last,
    j.created_at desc,
    j.id desc
  limit least(greatest(max_rows, 0), 1000);
$$;

-- Counts ignore the selected facets so they stay stable while the mobile sheet
-- edits a draft that hasn't hit the server yet.
create function public.live_job_facets(
  search_text text default '',
  place text default ''
)
returns table (facet text, value text, jobs bigint)
language sql
stable
set search_path = ''
as $$
  with matched as (
    select * from public.live_jobs_matching(search_text, place, false)
  )
  select 'industry', m.industry, count(*) from matched m group by m.industry
  union all
  select 'job_type', m.job_type, count(*) from matched m group by m.job_type
  union all
  select 'work_mode', m.work_mode, count(*) from matched m group by m.work_mode;
$$;

revoke execute on function public.like_pattern(text) from public, anon, authenticated;
revoke execute on function public.live_jobs_matching(text, text, boolean) from public, anon, authenticated;
revoke execute on function public.search_live_jobs(text, text, text[], text[], text[], boolean, text, integer) from public, anon, authenticated;
revoke execute on function public.live_job_facets(text, text) from public, anon, authenticated;

grant execute on function public.like_pattern(text) to service_role;
grant execute on function public.live_jobs_matching(text, text, boolean) to service_role;
grant execute on function public.search_live_jobs(text, text, text[], text[], text[], boolean, text, integer) to service_role;
grant execute on function public.live_job_facets(text, text) to service_role;
