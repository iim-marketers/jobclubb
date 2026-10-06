alter table public.company_jobs add column slug text;

update public.company_jobs
set slug = coalesce(
    nullif(trim(both '-' from regexp_replace(lower(designation), '[^a-z0-9]+', '-', 'g')), ''),
    'job'
  ) || '-' || substr(replace(id::text, '-', ''), 1, 6);

alter table public.company_jobs
  alter column slug set not null,
  add constraint company_jobs_slug_key unique (slug),
  add constraint company_jobs_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
