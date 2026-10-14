create table public.saved_jobs (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  job_id uuid not null references public.company_jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

create index saved_jobs_candidate_id_created_at_idx
  on public.saved_jobs (candidate_id, created_at desc);

alter table public.saved_jobs enable row level security;

revoke all on public.saved_jobs from anon, authenticated;
grant select, insert, update, delete on public.saved_jobs to service_role;
