-- Auth applies app metadata after inserting the user, so the company trigger
-- can't see a partner flag in time and the insert-time location check fails.
-- The server now flags partners right after creating them; sign-up validation
-- already requires a city and pincode for property companies.
alter table public.companies drop constraint companies_property_location;

create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  if meta ->> 'role' is distinct from 'company' then
    return new;
  end if;

  insert into public.companies (
    id, company_name, property_name, industry, size, website, gstin, city, pincode,
    contact_name, designation, email, phone, terms_version, email_verified_at, status
  ) values (
    new.id,
    meta ->> 'company_name',
    nullif(meta ->> 'property_name', ''),
    meta ->> 'industry',
    meta ->> 'size',
    nullif(meta ->> 'website', ''),
    nullif(meta ->> 'gstin', ''),
    nullif(meta ->> 'city', ''),
    nullif(meta ->> 'pincode', ''),
    meta ->> 'contact_name',
    nullif(meta ->> 'designation', ''),
    new.email,
    meta ->> 'phone',
    meta ->> 'terms_version',
    new.email_confirmed_at,
    case when new.email_confirmed_at is null then 'pending_email' else 'verified' end
  );
  return new;
end;
$$;
