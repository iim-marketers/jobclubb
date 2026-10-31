alter table public.companies
  alter column city drop not null,
  alter column pincode drop not null,
  add constraint companies_property_location
    check (is_partner or (city is not null and pincode is not null));
