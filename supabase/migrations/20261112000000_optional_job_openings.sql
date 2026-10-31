alter table public.company_jobs
  alter column openings drop not null,
  alter column openings drop default;
