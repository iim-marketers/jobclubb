-- Number applicants across the whole company rather than per job: per-job
-- numbering gave a candidate CAND-0001 on two jobs from the same employer,
-- which links the applications.
alter table public.job_applications
  drop constraint job_applications_job_candidate_no_key;

alter table public.company_jobs
  drop column applicant_seq;

alter table public.companies
  add column applicant_seq integer not null default 0;

update public.job_applications a
set candidate_no = n.no
from (
  select id, row_number() over (partition by company_id order by created_at, id) as no
  from public.job_applications
) n
where n.id = a.id;

update public.companies co
set applicant_seq = s.max_no
from (
  select company_id, max(candidate_no) as max_no
  from public.job_applications
  group by company_id
) s
where s.company_id = co.id;

alter table public.job_applications
  add constraint job_applications_company_candidate_no_key unique (company_id, candidate_no);

-- The share lock stops the job from closing before the insert commits; the
-- counter update locks the company row, which serialises numbering.
create or replace function public.job_applications_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  job record;
begin
  select j.company_id, j.designation into job
  from public.company_jobs j
  where j.id = new.job_id and j.status = 'live'
  for share;

  if not found then
    raise exception 'Job % is not accepting applications', new.job_id
      using errcode = 'P0001', hint = 'job_not_live';
  end if;

  new.company_id := job.company_id;
  new.job_title := job.designation;
  update public.companies
  set applicant_seq = applicant_seq + 1
  where id = job.company_id
  returning company_name, applicant_seq into new.company_name, new.candidate_no;
  select c.first_name || ' ' || c.last_name into new.candidate_name
  from public.candidates c
  where c.id = new.candidate_id;
  return new;
end;
$$;
