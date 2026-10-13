-- An application can go through any number of interview rounds, one at a time.
-- Each round ends in next_round (schedule another), selected (final) or
-- not_selected (rejects the application).

-- Settled rows are frozen by the before-update trigger, so it is switched off
-- while existing rows are backfilled. 'cleared' was the final result before
-- rounds existed.
alter table public.job_interviews disable trigger job_interviews_before_update;

alter table public.job_interviews
  drop constraint job_interviews_outcome_check;
update public.job_interviews set outcome = 'selected' where outcome = 'cleared';
alter table public.job_interviews
  add constraint job_interviews_outcome_check
    check (outcome in ('next_round', 'selected', 'not_selected')),
  add column round_no smallint;
update public.job_interviews set round_no = 1;

alter table public.job_interviews enable trigger job_interviews_before_update;

alter table public.job_interviews
  alter column round_no set not null,
  add constraint job_interviews_round_no check (round_no between 1 and 10);

drop index public.job_interviews_one_per_application;
create unique index job_interviews_one_open_per_application
  on public.job_interviews (application_id)
  where cancelled_at is null and outcome is null;
create unique index job_interviews_round_no_per_application
  on public.job_interviews (application_id, round_no)
  where cancelled_at is null;

-- A rescheduled round keeps its number, since cancelled rounds aren't counted.
create or replace function public.job_interviews_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  app record;
  latest_round smallint;
  latest_outcome text;
begin
  select company_id, candidate_id, stage, status, job_title, company_name, candidate_name into app
  from public.job_applications
  where id = new.application_id
  for update;

  if not found or app.company_id <> new.company_id or app.status <> 'active' then
    raise exception 'Application % is not ready for an interview', new.application_id
      using errcode = 'P0001', hint = 'not_ready_for_interview';
  end if;

  select round_no, outcome into latest_round, latest_outcome
  from public.job_interviews
  where application_id = new.application_id and cancelled_at is null
  order by round_no desc
  limit 1;
  latest_round := coalesce(latest_round, 0);

  if not (
    (app.stage = 2 and latest_round = 0)
    or (app.stage = 3 and latest_outcome is not distinct from 'next_round' and latest_round < 10)
  ) then
    raise exception 'Application % is not ready for an interview', new.application_id
      using errcode = 'P0001', hint = 'not_ready_for_interview';
  end if;

  new.round_no := latest_round + 1;
  new.candidate_id := app.candidate_id;
  new.job_title := app.job_title;
  new.company_name := app.company_name;
  new.candidate_name := app.candidate_name;
  if app.stage = 2 then
    update public.job_applications
    set stage = 3, updated_at = now()
    where id = new.application_id;
  end if;
  return new;
end;
$$;

-- Cancelling a later round leaves the application in Interview; only
-- cancelling the sole remaining round sends it back to the shortlist.
create or replace function public.job_interviews_after_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cancelled_at is not null then
    update public.job_applications
    set stage = 2, updated_at = now()
    where id = new.application_id and stage = 3 and status = 'active'
      and not exists (
        select 1 from public.job_interviews
        where application_id = new.application_id and cancelled_at is null
      );
  elsif new.outcome = 'not_selected' then
    update public.job_applications
    set status = 'rejected', rejected_at = new.outcome_at, updated_at = now()
    where id = new.application_id and status = 'active';
  end if;
  return new;
end;
$$;
