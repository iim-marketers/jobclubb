-- Each property signs up separately, so a job's location is always its
-- property's: whatever city or pincode the caller sends is overwritten.
create function public.company_jobs_property_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select city, pincode into new.city, new.pincode
  from public.companies
  where id = new.company_id;
  return new;
end;
$$;

create trigger company_jobs_property_location
  before insert or update on public.company_jobs
  for each row execute function public.company_jobs_property_location();

create function public.companies_move_jobs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.company_jobs
  set city = new.city, pincode = new.pincode
  where company_id = new.id;
  return new;
end;
$$;

create trigger companies_move_jobs
  after update of city, pincode on public.companies
  for each row
  when (old.city is distinct from new.city or old.pincode is distinct from new.pincode)
  execute function public.companies_move_jobs();

update public.company_jobs j
set city = c.city, pincode = c.pincode
from public.companies c
where c.id = j.company_id
  and (j.city is distinct from c.city or j.pincode is distinct from c.pincode);
