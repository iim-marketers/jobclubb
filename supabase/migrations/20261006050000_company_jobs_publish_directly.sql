update public.company_jobs set status = 'live' where status = 'in_review';
update public.company_jobs set status = 'closed' where status = 'rejected';

alter table public.company_jobs
  drop constraint company_jobs_status_check,
  alter column status set default 'live',
  add constraint company_jobs_status_check check (status in ('live', 'closed')),
  drop column approved_at;
