-- JobClubb screens every application and runs the first-round interview before
-- referring a candidate to the employer. Stages are now:
--   0 applied, 1 screening by JobClubb, 2 referred to the employer,
--   3 employer interview, 4 offer.
-- Companies only ever see stage 2 and above.

alter table public.job_applications
  drop constraint job_applications_viewed,
  add column screening_cleared_at timestamptz,
  add column referral_note text check (length(referral_note) <= 2000);

-- Applications already with a company count as referred. From here on
-- shortlisted_at is when JobClubb referred the candidate, which is also when
-- the employer first sees their name.
update public.job_applications
set stage = 2, shortlisted_at = now(), updated_at = now()
where stage < 2 and status = 'active';

-- Round 0 is JobClubb's own interview; the employer's rounds start at 1.
-- The host's stage gates in the triggers below keep a JobClubb interview from
-- ever coexisting with an employer one.
alter table public.job_interviews
  add column host text not null default 'company' check (host in ('company', 'jobclubb')),
  drop constraint job_interviews_round_no,
  add constraint job_interviews_round_no check (
    case host when 'jobclubb' then round_no = 0 else round_no between 1 and 10 end
  ),
  add constraint job_interviews_jobclubb_outcome check (
    host = 'company' or outcome is distinct from 'selected'
  );

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
  select company_id, candidate_id, stage, status, screening_cleared_at,
    job_title, company_name, candidate_name into app
  from public.job_applications
  where id = new.application_id
  for update;

  if not found or app.status <> 'active' then
    raise exception 'Application % is not ready for an interview', new.application_id
      using errcode = 'P0001', hint = 'not_ready_for_interview';
  end if;

  if new.host = 'jobclubb' then
    if app.stage > 1 or app.screening_cleared_at is not null or exists (
      select 1 from public.job_interviews
      where application_id = new.application_id and cancelled_at is null
    ) then
      raise exception 'Application % is not ready for an interview', new.application_id
        using errcode = 'P0001', hint = 'not_ready_for_interview';
    end if;
    new.round_no := 0;
    new.company_id := app.company_id;
    if app.stage = 0 then
      update public.job_applications
      set stage = 1, updated_at = now()
      where id = new.application_id;
    end if;
  else
    if app.company_id <> new.company_id then
      raise exception 'Application % is not ready for an interview', new.application_id
        using errcode = 'P0001', hint = 'not_ready_for_interview';
    end if;

    select round_no, outcome into latest_round, latest_outcome
    from public.job_interviews
    where application_id = new.application_id and cancelled_at is null and host = 'company'
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
    if app.stage = 2 then
      update public.job_applications
      set stage = 3, updated_at = now()
      where id = new.application_id;
    end if;
  end if;

  new.candidate_id := app.candidate_id;
  new.job_title := app.job_title;
  new.company_name := app.company_name;
  new.candidate_name := app.candidate_name;
  return new;
end;
$$;

create or replace function public.job_interviews_after_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cancelled_at is not null then
    if new.host = 'jobclubb' then
      update public.job_applications
      set stage = 0, updated_at = now()
      where id = new.application_id and stage = 1 and status = 'active'
        and screening_cleared_at is null;
    else
      update public.job_applications
      set stage = 2, updated_at = now()
      where id = new.application_id and stage = 3 and status = 'active'
        and not exists (
          select 1 from public.job_interviews
          where application_id = new.application_id and cancelled_at is null and host = 'company'
        );
    end if;
  elsif new.outcome = 'not_selected' then
    update public.job_applications
    set status = 'rejected', rejected_at = new.outcome_at, updated_at = now()
    where id = new.application_id and status = 'active';
  elsif new.outcome = 'next_round' and new.host = 'jobclubb' then
    update public.job_applications
    set screening_cleared_at = new.outcome_at, updated_at = now()
    where id = new.application_id and stage = 1 and status = 'active';
  end if;
  return new;
end;
$$;

-- What the employer reports after the candidate joins (employer agreement,
-- mutual disclosure clause). The placement itself stays joined.
alter table public.placements
  add column left_on date,
  add column left_reason text check (left_reason in ('resigned', 'terminated', 'ended')),
  add column left_notes text check (length(left_notes) <= 1000),
  add column left_reported_at timestamptz,
  add constraint placements_left check (
    (left_on is null) = (left_reason is null)
    and (left_on is null) = (left_reported_at is null)
    and (left_on is null or status = 'joined')
  );
