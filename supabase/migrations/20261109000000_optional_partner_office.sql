-- A partner's office address is for records only, so the admin may leave it
-- out. Property companies still need one: their jobs are posted there.
alter table public.companies
  alter column city drop not null,
  alter column pincode drop not null,
  add constraint companies_property_location
    check (is_partner or (city is not null and pincode is not null));
