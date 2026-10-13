-- A disclosed salary may give only a minimum ("From ₹3 LPA"); undisclosed
-- still means both bounds are null.
alter table public.company_jobs
  drop constraint company_jobs_salary_disclosed,
  add constraint company_jobs_salary_disclosed
    check (salary_max_lpa is null or salary_min_lpa is not null);

-- Minimum-only jobs sort by their minimum instead of after every range.
create or replace function public.search_live_jobs(
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
    case when sort_by = 'salary' then coalesce(j.salary_max_lpa, j.salary_min_lpa) end desc nulls last,
    case when sort_by = 'salary' then j.salary_min_lpa end desc nulls last,
    case when sort_by = 'experience' then j.experience_min end asc nulls last,
    case when sort_by = 'experience' then j.experience_max end asc nulls last,
    j.created_at desc,
    j.id desc
  limit least(greatest(max_rows, 0), 1000);
$$;
