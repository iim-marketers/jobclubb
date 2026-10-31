create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  partner boolean := coalesce((new.raw_app_meta_data ->> 'partner')::boolean, false);
begin
  if meta ->> 'role' is distinct from 'company' then
    return new;
  end if;

  insert into public.companies (
    id, company_name, property_name, industry, size, website, gstin, city, pincode,
    contact_name, designation, email, phone, terms_version, email_verified_at, status,
    is_partner, verification_route
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
    case when new.email_confirmed_at is null then 'pending_email' else 'verified' end,
    partner,
    case when partner then 'manual' else 'email' end
  );
  return new;
end;
$$;
