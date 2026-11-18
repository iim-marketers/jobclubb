-- Keep in sync with INDUSTRIES (name and sector) in src/lib/taxonomy.ts.
create function public.industry_search_terms(industry text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case industry
    when 'airlines' then array['Airlines']
    when 'airport' then array['Airport']
    when 'hotels' then array['Hotels', 'Hospitality']
    when 'restaurants' then array['Restaurants', 'Hospitality']
    when 'cafes' then array['Cafes', 'Hospitality']
    when 'bars-nightclubs' then array['Bars & Nightclubs', 'Hospitality']
    when 'cruise-lines' then array['Cruise Lines', 'Hospitality']
    when 'travel-tourism' then array['Travel & Tourism']
    else array[industry]
  end;
$$;

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
      or exists (
        select 1 from unnest(public.industry_search_terms(j.industry)) t
        where t ilike f.q
      )
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

revoke execute on function public.industry_search_terms(text) from public, anon, authenticated;
grant execute on function public.industry_search_terms(text) to service_role;
