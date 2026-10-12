-- A number (shown as CAND-0001) stands in for the hidden name.
alter table public.company_jobs
  add column applicant_seq integer not null default 0;

alter table public.job_applications
  add column candidate_no integer;

update public.job_applications a
set candidate_no = n.no
from (
  select id, row_number() over (partition by job_id order by created_at, id) as no
  from public.job_applications
) n
where n.id = a.id;

update public.company_jobs j
set applicant_seq = s.max_no
from (
  select job_id, max(candidate_no) as max_no
  from public.job_applications
  group by job_id
) s
where s.job_id = j.id;

alter table public.job_applications
  alter column candidate_no set not null,
  add constraint job_applications_job_candidate_no_key unique (job_id, candidate_no);

-- The counter update locks the job row, which serialises numbering and stops
-- the job from closing between this check and the insert committing.
create or replace function public.job_applications_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  job record;
begin
  update public.company_jobs
  set applicant_seq = applicant_seq + 1
  where id = new.job_id and status = 'live'
  returning company_id, designation, applicant_seq into job;

  if not found then
    raise exception 'Job % is not accepting applications', new.job_id
      using errcode = 'P0001', hint = 'job_not_live';
  end if;

  new.company_id := job.company_id;
  new.job_title := job.designation;
  new.candidate_no := job.applicant_seq;
  select co.company_name into new.company_name
  from public.companies co
  where co.id = job.company_id;
  select c.first_name || ' ' || c.last_name into new.candidate_name
  from public.candidates c
  where c.id = new.candidate_id;
  return new;
end;
$$;
