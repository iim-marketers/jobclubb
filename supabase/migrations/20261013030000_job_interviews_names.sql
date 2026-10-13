-- Readable names alongside the ids, copied from the application and kept in
-- step with it, so the app never writes them itself.
-- candidate_name must never be selected by a company-facing query.
alter table public.job_interviews
  add column job_title text,
  add column company_name text,
  add column candidate_name text;

-- Settled interviews are otherwise frozen, but must still follow a rename.
create or replace function public.job_interviews_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  name_columns constant text[] := array['job_title', 'company_name', 'candidate_name'];
begin
  if to_jsonb(new) - name_columns = to_jsonb(old) - name_columns then
    return new;
  end if;
  if old.cancelled_at is not null or old.outcome is not null then
    raise exception 'Interview % is already settled', old.id
      using errcode = 'P0001', hint = 'interview_settled';
  end if;
  if new.outcome is not null
    and least(new.finished_at, new.starts_at + make_interval(mins => new.duration_mins)) > now() then
    raise exception 'Interview % has not finished', old.id
      using errcode = 'P0001', hint = 'interview_not_finished';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

update public.job_interviews i
set
  job_title = a.job_title,
  company_name = a.company_name,
  candidate_name = a.candidate_name
from public.job_applications a
where a.id = i.application_id;

alter table public.job_interviews
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;

create or replace function public.job_interviews_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  app record;
begin
  select company_id, candidate_id, stage, status, job_title, company_name, candidate_name into app
  from public.job_applications
  where id = new.application_id
  for update;

  if not found or app.company_id <> new.company_id
    or app.status <> 'active' or app.stage <> 2 then
    raise exception 'Application % is not ready for an interview', new.application_id
      using errcode = 'P0001', hint = 'not_shortlisted';
  end if;

  new.candidate_id := app.candidate_id;
  new.job_title := app.job_title;
  new.company_name := app.company_name;
  new.candidate_name := app.candidate_name;
  update public.job_applications
  set stage = 3, updated_at = now()
  where id = new.application_id;
  return new;
end;
$$;

-- The job_applications sync triggers already follow renames of jobs,
-- companies and candidates; this passes them on.
create function public.sync_job_interview_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.job_interviews
  set
    job_title = new.job_title,
    company_name = new.company_name,
    candidate_name = new.candidate_name
  where application_id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_job_interview_names() from public, anon, authenticated;

create trigger on_job_application_names_changed
  after update of job_title, company_name, candidate_name on public.job_applications
  for each row
  when (
    old.job_title is distinct from new.job_title
    or old.company_name is distinct from new.company_name
    or old.candidate_name is distinct from new.candidate_name
  )
  execute function public.sync_job_interview_names();
