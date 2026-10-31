alter table public.company_jobs
  alter column experience_min drop not null,
  alter column experience_max drop not null,
  add constraint company_jobs_experience_stated
    check ((experience_min is null) = (experience_max is null)),
  drop constraint company_jobs_description_check,
  add constraint company_jobs_description_check
    check (length(description) <= 20000),
  drop constraint company_jobs_responsibilities_check,
  add constraint company_jobs_responsibilities_check
    check (cardinality(responsibilities) <= 15),
  drop constraint company_jobs_requirements_check,
  add constraint company_jobs_requirements_check
    check (cardinality(requirements) <= 15);

update public.company_jobs j
set experience_min = null, experience_max = null
from public.companies c
where c.id = j.company_id
  and c.is_partner
  and c.company_name = 'Emporium';
