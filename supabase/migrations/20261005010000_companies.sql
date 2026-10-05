create table public.companies (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null check (length(company_name) between 1 and 120),
  property_name text check (length(property_name) between 1 and 120),
  sector text not null,
  size text not null check (size in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  website text check (length(website) <= 255),
  gstin text check (gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  city text not null check (length(city) between 1 and 80),
  pincode text not null check (pincode ~ '^\d{6}$'),
  contact_name text not null check (length(contact_name) between 1 and 80),
  designation text not null check (length(designation) between 1 and 80),
  email text not null unique,
  phone text not null,
  verification_route text not null check (verification_route in ('email', 'manual')),
  status text not null default 'pending_email'
    check (status in ('pending_email', 'pending_review', 'verified', 'rejected')),
  proof_path text,
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  email_verified_at timestamptz,
  email_verified boolean generated always as (email_verified_at is not null) stored,
  created_at timestamptz not null default now(),
  constraint companies_proof_path_own_folder
    check (proof_path is null or proof_path like id::text || '/%')
);

alter table public.companies enable row level security;

revoke all on public.companies from anon, authenticated;
grant select, insert, update, delete on public.companies to service_role;
grant select on public.companies to authenticated;

create policy "Companies read their own profile"
  on public.companies for select
  to authenticated
  using ((select auth.uid()) = id);

create function public.handle_new_company()
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
    id, company_name, property_name, sector, size, website, gstin, city, pincode,
    contact_name, designation, email, phone, verification_route, terms_version,
    email_verified_at
  ) values (
    new.id,
    meta ->> 'company_name',
    nullif(meta ->> 'property_name', ''),
    meta ->> 'sector',
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

revoke execute on function public.handle_new_company() from public, anon, authenticated;

create trigger on_auth_user_created_company
  after insert on auth.users
  for each row execute function public.handle_new_company();

-- Confirming the email verifies an email-route company outright; a manual-route
-- one moves on to admin review.
create function public.sync_company_email_verified()
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
      when new.email_confirmed_at is not null and status = 'pending_email'
        then case verification_route when 'email' then 'verified' else 'pending_review' end
      else status
    end
  where id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_company_email_verified() from public, anon, authenticated;

create trigger on_auth_user_email_confirmed_company
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sync_company_email_verified();

create trigger on_company_deleted
  after delete on public.companies
  for each row execute function public.delete_login_for_candidate();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-proofs',
  'company-proofs',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy "Companies read their own proof document"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'company-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create function public.delete_files_for_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  secret_key text;
  file record;
begin
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret_key
    from vault.decrypted_secrets where name = 'storage_secret_key';

  if project_url is null or secret_key is null then
    raise warning 'Files for deleted company % were kept: Vault secrets project_url and storage_secret_key are not set.', old.id;
    return old;
  end if;

  for file in
    select bucket_id, name from storage.objects
    where bucket_id = 'company-proofs'
      and name like old.id::text || '/%'
  loop
    perform net.http_delete(
      url := rtrim(project_url, '/') || '/storage/v1/object/' || file.bucket_id || '/' || file.name,
      headers := jsonb_build_object('apikey', secret_key, 'Authorization', 'Bearer ' || secret_key)
    );
  end loop;

  return old;
end;
$$;

revoke execute on function public.delete_files_for_company() from public, anon, authenticated;

create trigger on_company_deleted_delete_files
  after delete on public.companies
  for each row execute function public.delete_files_for_company();
