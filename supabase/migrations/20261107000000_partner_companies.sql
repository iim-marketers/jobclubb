-- Partner companies have a tie-up with JobClubb and are created by the admin.
-- They aren't tied to a property: each job keeps the location it's posted
-- with, and the company's own city and pincode are just its office address.
alter table public.companies add column is_partner boolean not null default false;

create or replace function public.company_jobs_property_location()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  company record;
begin
  select c.city, c.pincode, c.company_name, c.is_partner into company
  from public.companies c
  where c.id = new.company_id;

  new.company_name := company.company_name;
  if not company.is_partner then
    new.city := company.city;
    new.pincode := company.pincode;
  end if;
  return new;
end;
$$;

drop trigger companies_move_jobs on public.companies;

create trigger companies_move_jobs
  after update of city, pincode on public.companies
  for each row
  when (
    not new.is_partner
    and (old.city is distinct from new.city or old.pincode is distinct from new.pincode)
  )
  execute function public.companies_move_jobs();
