create table public.job_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  starts_at timestamptz not null,
  duration_mins smallint not null check (duration_mins between 15 and 240),
  mode text not null check (mode in ('video', 'in_person', 'phone')),
  place text not null check (length(place) between 1 and 300),
  interviewer text not null check (length(interviewer) between 1 and 80),
  round text not null check (length(round) between 1 and 60),
  outcome text check (outcome in ('cleared', 'not_selected')),
  outcome_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_interviews_outcome check ((outcome is null) = (outcome_at is null)),
  constraint job_interviews_cancelled_outcome check (cancelled_at is null or outcome is null)
);

create unique index job_interviews_one_per_application
  on public.job_interviews (application_id)
  where cancelled_at is null;
create index job_interviews_company_id_starts_at_idx
  on public.job_interviews (company_id, starts_at);
create index job_interviews_candidate_id_starts_at_idx
  on public.job_interviews (candidate_id, starts_at);

alter table public.job_interviews enable row level security;

-- Same rule as job_applications: no policies, so a company can never select
-- candidate_id. Every read and write goes through the server.
revoke all on public.job_interviews from anon, authenticated;
grant select, insert, update, delete on public.job_interviews to service_role;

-- Locks the application so a concurrent reject or second schedule can't slip
-- in between the stage check and the stage update.
create function public.job_interviews_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  app record;
begin
  select company_id, candidate_id, stage, status into app
  from public.job_applications
  where id = new.application_id
  for update;

  if not found or app.company_id <> new.company_id
    or app.status <> 'active' or app.stage <> 2 then
    raise exception 'Application % is not ready for an interview', new.application_id
      using errcode = 'P0001', hint = 'not_shortlisted';
  end if;

  new.candidate_id := app.candidate_id;
  update public.job_applications
  set stage = 3, updated_at = now()
  where id = new.application_id;
  return new;
end;
$$;

create function public.job_interviews_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.cancelled_at is not null or old.outcome is not null then
    raise exception 'Interview % is already settled', old.id
      using errcode = 'P0001', hint = 'interview_settled';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- After, not before: rejecting the application cancels its open interviews,
-- and this row must already show its outcome so that cascade skips it.
create function public.job_interviews_after_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cancelled_at is not null then
    update public.job_applications
    set stage = 2, updated_at = now()
    where id = new.application_id and stage = 3 and status = 'active';
  elsif new.outcome = 'not_selected' then
    update public.job_applications
    set status = 'rejected', rejected_at = new.outcome_at, updated_at = now()
    where id = new.application_id and status = 'active';
  end if;
  return new;
end;
$$;

create function public.job_applications_after_reject()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.job_interviews
  set outcome = 'not_selected', outcome_at = new.rejected_at
  where application_id = new.id
    and cancelled_at is null and outcome is null and starts_at <= now();
  update public.job_interviews
  set cancelled_at = new.rejected_at
  where application_id = new.id
    and cancelled_at is null and outcome is null;
  return new;
end;
$$;

revoke execute on function public.job_interviews_before_insert() from public, anon, authenticated;
revoke execute on function public.job_interviews_before_update() from public, anon, authenticated;
revoke execute on function public.job_interviews_after_update() from public, anon, authenticated;
revoke execute on function public.job_applications_after_reject() from public, anon, authenticated;

create trigger job_interviews_before_insert
  before insert on public.job_interviews
  for each row execute function public.job_interviews_before_insert();

create trigger job_interviews_before_update
  before update on public.job_interviews
  for each row execute function public.job_interviews_before_update();

create trigger job_interviews_after_update
  after update of cancelled_at, outcome on public.job_interviews
  for each row
  when (old.cancelled_at is distinct from new.cancelled_at or old.outcome is distinct from new.outcome)
  execute function public.job_interviews_after_update();

create trigger job_applications_after_reject
  after update of status on public.job_applications
  for each row
  when (old.status = 'active' and new.status = 'rejected')
  execute function public.job_applications_after_reject();
