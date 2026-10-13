alter table public.job_interviews
  add column finished_at timestamptz,
  add constraint job_interviews_finished check (finished_at is null or finished_at >= starts_at);

create or replace function public.job_interviews_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

-- An interview still in progress when the applicant is rejected ends there.
create or replace function public.job_applications_after_reject()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.job_interviews
  set outcome = 'not_selected',
    outcome_at = new.rejected_at,
    finished_at = least(finished_at, starts_at + make_interval(mins => duration_mins), now())
  where application_id = new.id
    and cancelled_at is null and outcome is null and starts_at <= now();
  update public.job_interviews
  set cancelled_at = new.rejected_at
  where application_id = new.id
    and cancelled_at is null and outcome is null;
  return new;
end;
$$;
