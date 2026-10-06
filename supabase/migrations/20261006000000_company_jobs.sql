create table public.company_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vertical text not null,
  role text not null check (length(role) between 1 and 120),
  designation text not null check (length(designation) between 1 and 120),
  city text not null check (length(city) between 1 and 80),
  pincode text not null check (pincode ~ '^\d{6}$'),
  job_type text not null check (job_type in ('Full time', 'Internship')),
  work_mode text not null check (work_mode in ('WFO', 'WFH', 'Hybrid', 'Field', 'Onsite')),
  experience_min smallint not null check (experience_min between 0 and 40),
  experience_max smallint not null check (experience_max between 0 and 40),
  salary_min_lpa numeric(5, 2) not null check (salary_min_lpa > 0),
  salary_max_lpa numeric(5, 2) not null check (salary_max_lpa <= 100),
  openings smallint not null default 1 check (openings between 1 and 999),
  description text not null check (length(description) between 30 and 4000),
  responsibilities text[] not null check (cardinality(responsibilities) between 1 and 15),
  requirements text[] not null check (cardinality(requirements) between 1 and 15),
  benefits text[] not null default '{}' check (cardinality(benefits) <= 15),
  status text not null default 'in_review'
    check (status in ('in_review', 'live', 'closed', 'rejected')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_jobs_experience_range check (experience_max >= experience_min),
  constraint company_jobs_salary_range check (salary_max_lpa >= salary_min_lpa)
);

create index company_jobs_company_id_created_at_idx
  on public.company_jobs (company_id, created_at desc);

alter table public.company_jobs enable row level security;

-- Writes go through the server so a company can't publish its own posting
-- without review.
revoke all on public.company_jobs from anon, authenticated;
grant select, insert, update, delete on public.company_jobs to service_role;
grant select on public.company_jobs to authenticated;

create policy "Companies read their own jobs"
  on public.company_jobs for select
  to authenticated
  using ((select auth.uid()) = company_id);
