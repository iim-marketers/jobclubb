-- Companies can only sign up with a company email, so confirming it verifies the
-- account outright and there is no admin review step. `verification_route` and
-- 'rejected' stay for rows created before this change.
update public.companies set status = 'verified' where status = 'pending_review';

alter table public.companies
  drop constraint companies_status_check,
  add constraint companies_status_check check (status in ('pending_email', 'verified', 'rejected')),
  alter column verification_route set default 'email';

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
    meta ->> 'city',
    meta ->> 'pincode',
    meta ->> 'contact_name',
    meta ->> 'designation',
    new.email,
    meta ->> 'phone',
    meta ->> 'terms_version',
    new.email_confirmed_at,
    case when new.email_confirmed_at is null then 'pending_email' else 'verified' end
  );
  return new;
end;
$$;

create or replace function public.sync_company_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.companies
  set
    email_verified_at = new.email_confirmed_at,
    status = case
      when new.email_confirmed_at is not null and status = 'pending_email' then 'verified'
      else status
    end
  where id = new.id;
  return new;
end;
$$;
