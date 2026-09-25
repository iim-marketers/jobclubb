create table public.candidate_resumes (
  candidate_id uuid primary key references public.candidates (id) on delete cascade,
  target_role text not null check (length(target_role) between 1 and 120),
  job_description text check (length(job_description) <= 12000),
  keywords text[] not null default '{}',
  resume jsonb not null,
  original_score smallint check (original_score between 0 and 100),
  generated_at timestamptz not null default now()
);

alter table public.candidate_resumes enable row level security;

revoke all on public.candidate_resumes from anon, authenticated;
grant select, insert, update, delete on public.candidate_resumes to service_role;
grant select on public.candidate_resumes to authenticated;

create policy "Candidates read their own resume"
  on public.candidate_resumes for select
  to authenticated
  using ((select auth.uid()) = candidate_id);
