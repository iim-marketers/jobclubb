-- Readable names alongside the ids. The database fills them in and keeps them
-- in step with their source rows, so the app never writes them itself.
-- candidate_name must never be selected by a company-facing query.
alter table public.job_applications
  add column job_title text,
  add column company_name text,
  add column candidate_name text;

update public.job_applications a
set
  job_title = j.designation,
  company_name = co.company_name,
  candidate_name = c.first_name || ' ' || c.last_name
from public.company_jobs j, public.companies co, public.candidates c
where j.id = a.job_id and co.id = a.company_id and c.id = a.candidate_id;

alter table public.job_applications
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;

create or replace function public.job_applications_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  job record;
begin
  select j.company_id, j.designation, co.company_name into job
  from public.company_jobs j
  join public.companies co on co.id = j.company_id
  where j.id = new.job_id and j.status = 'live'
  for share of j;

  if not found then
    raise exception 'Job % is not accepting applications', new.job_id
      using errcode = 'P0001', hint = 'job_not_live';
  end if;

  new.company_id := job.company_id;
  new.job_title := job.designation;
  new.company_name := job.company_name;
  select c.first_name || ' ' || c.last_name into new.candidate_name
  from public.candidates c
  where c.id = new.candidate_id;
  return new;
end;
$$;

-- Security definer: candidates rename themselves through RLS, and that role
-- has no access to job_applications.
create function public.sync_job_application_job_title()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.job_applications set job_title = new.designation where job_id = new.id;
  return new;
end;
$$;

create function public.sync_job_application_company_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.job_applications set company_name = new.company_name where company_id = new.id;
  return new;
end;
$$;

create function public.sync_job_application_candidate_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.job_applications
  set candidate_name = new.first_name || ' ' || new.last_name
  where candidate_id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_job_application_job_title() from public, anon, authenticated;
revoke execute on function public.sync_job_application_company_name() from public, anon, authenticated;
revoke execute on function public.sync_job_application_candidate_name() from public, anon, authenticated;

create trigger on_company_job_designation_changed
  after update of designation on public.company_jobs
  for each row
  when (old.designation is distinct from new.designation)
  execute function public.sync_job_application_job_title();

create trigger on_company_name_changed
  after update of company_name on public.companies
  for each row
  when (old.company_name is distinct from new.company_name)
  execute function public.sync_job_application_company_name();

create trigger on_candidate_name_changed
  after update of first_name, last_name on public.candidates
  for each row
  when (old.first_name is distinct from new.first_name or old.last_name is distinct from new.last_name)
  execute function public.sync_job_application_candidate_name();
