alter table public.candidates rename column vertical to industry;
alter table public.companies rename column sector to industry;
alter table public.company_jobs rename column vertical to industry;

-- Sign-ups started before the app deploy still send the old metadata keys.
create or replace function public.handle_new_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  if meta ->> 'role' is distinct from 'candidate' then
    return new;
  end if;

  insert into public.candidates (
    id, first_name, last_name, email, phone, city, pincode, industry,
    source, code, terms_version, email_verified_at
  ) values (
    new.id,
    meta ->> 'first_name',
    meta ->> 'last_name',
    new.email,
    meta ->> 'phone',
    meta ->> 'city',
    meta ->> 'pincode',
    coalesce(meta ->> 'industry', meta ->> 'vertical'),
    meta ->> 'source',
    nullif(meta ->> 'code', ''),
    meta ->> 'terms_version',
    new.email_confirmed_at
  );
  return new;
end;
$$;

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
    contact_name, designation, email, phone, verification_route, terms_version,
    email_verified_at
  ) values (
    new.id,
    meta ->> 'company_name',
    nullif(meta ->> 'property_name', ''),
    coalesce(meta ->> 'industry', meta ->> 'sector'),
    meta ->> 'size',
    nullif(meta ->> 'website', ''),
    nullif(meta ->> 'gstin', ''),
    meta ->> 'city',
    meta ->> 'pincode',
    meta ->> 'contact_name',
    meta ->> 'designation',
    new.email,
    meta ->> 'phone',
    meta ->> 'verification_route',
    meta ->> 'terms_version',
    new.email_confirmed_at
  );
  return new;
end;
$$;
