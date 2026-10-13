-- Both salary bounds null means the company chose not to disclose pay.
alter table public.company_jobs
  alter column salary_min_lpa drop not null,
  alter column salary_max_lpa drop not null,
  add constraint company_jobs_salary_disclosed
    check ((salary_min_lpa is null) = (salary_max_lpa is null));
