alter table public.saved_jobs
  add column job_title text,
  add column candidate_name text;

update public.saved_jobs s
set
  job_title = j.designation,
  candidate_name = c.first_name || ' ' || c.last_name
from public.company_jobs j, public.candidates c
where j.id = s.job_id and c.id = s.candidate_id;

alter table public.saved_jobs
  alter column job_title set not null,
  alter column candidate_name set not null;

create function public.saved_jobs_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select j.designation into new.job_title
  from public.company_jobs j
  where j.id = new.job_id;
  select c.first_name || ' ' || c.last_name into new.candidate_name
  from public.candidates c
  where c.id = new.candidate_id;
  return new;
end;
$$;

-- Security definer: candidates rename themselves through RLS, and that role
-- has no access to saved_jobs.
create function public.sync_saved_job_title()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.saved_jobs set job_title = new.designation where job_id = new.id;
  return new;
end;
$$;

create function public.sync_saved_job_candidate_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.saved_jobs
  set candidate_name = new.first_name || ' ' || new.last_name
  where candidate_id = new.id;
  return new;
end;
$$;

revoke execute on function public.saved_jobs_before_insert() from public, anon, authenticated;
revoke execute on function public.sync_saved_job_title() from public, anon, authenticated;
revoke execute on function public.sync_saved_job_candidate_name() from public, anon, authenticated;

create trigger saved_jobs_before_insert
  before insert on public.saved_jobs
  for each row execute function public.saved_jobs_before_insert();

create trigger on_company_job_designation_changed_saved
  after update of designation on public.company_jobs
  for each row
  when (old.designation is distinct from new.designation)
  execute function public.sync_saved_job_title();

create trigger on_candidate_name_changed_saved
  after update of first_name, last_name on public.candidates
  for each row
  when (old.first_name is distinct from new.first_name or old.last_name is distinct from new.last_name)
  execute function public.sync_saved_job_candidate_name();
