create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (ref ~ '^JC-[0-9A-Z]{6}$'),
  job_id uuid not null references public.company_jobs (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  city text not null check (length(city) between 1 and 80),
  experience_months smallint not null check (experience_months between 0 and 720),
  skills text[] not null default '{}',
  -- Snapshots taken at apply time, so later resume edits don't change what the
  -- employer reviews. Only masked_resume ever leaves the server for a company.
  resume jsonb not null,
  masked_resume jsonb not null,
  stage smallint not null default 0 check (stage between 0 and 4),
  status text not null default 'active' check (status in ('active', 'rejected')),
  viewed_at timestamptz,
  shortlisted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_applications_job_candidate_key unique (job_id, candidate_id),
  constraint job_applications_viewed check (stage < 1 or viewed_at is not null),
  constraint job_applications_shortlisted check (stage < 2 or shortlisted_at is not null),
  constraint job_applications_rejected check ((status = 'rejected') = (rejected_at is not null))
);

create index job_applications_candidate_id_created_at_idx
  on public.job_applications (candidate_id, created_at desc);
create index job_applications_company_id_created_at_idx
  on public.job_applications (company_id, created_at desc);

alter table public.job_applications enable row level security;

-- No policies on purpose: a company must never be able to select candidate_id
-- or the unmasked resume, so every read and write goes through the server.
revoke all on public.job_applications from anon, authenticated;
grant select, insert, update, delete on public.job_applications to service_role;

-- company_id always comes from the job, and the share lock stops the job from
-- closing between this check and the insert committing.
create function public.job_applications_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  job_company uuid;
begin
  select company_id into job_company
  from public.company_jobs
  where id = new.job_id and status = 'live'
  for share;

  if job_company is null then
    raise exception 'Job % is not accepting applications', new.job_id
      using errcode = 'P0001', hint = 'job_not_live';
  end if;

  new.company_id := job_company;
  return new;
end;
$$;

revoke execute on function public.job_applications_before_insert() from public, anon, authenticated;

create trigger job_applications_before_insert
  before insert on public.job_applications
  for each row execute function public.job_applications_before_insert();
