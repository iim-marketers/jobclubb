-- Keep in sync with publicJobTitle() in src/lib/company-jobs.ts.
create function public.public_job_title(designation text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(designation, '\s+[–—-]\s.*$', '');
$$;

-- Guests now see the designation without its property, so they can search it.
create or replace function public.live_jobs_matching(
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
      or (titles_only and public.public_job_title(j.designation) ilike f.q)
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

revoke execute on function public.public_job_title(text) from public, anon, authenticated;
grant execute on function public.public_job_title(text) to service_role;
