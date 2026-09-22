alter table public.candidates
  add column email_verified_at timestamptz,
  add column email_verified boolean
    generated always as (email_verified_at is not null) stored;

update public.candidates c
set email_verified_at = u.email_confirmed_at
from auth.users u
where u.id = c.id;

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
    id, first_name, last_name, email, phone, city, pincode, vertical,
    source, code, terms_version, email_verified_at
  ) values (
    new.id,
    meta ->> 'first_name',
    meta ->> 'last_name',
    new.email,
    meta ->> 'phone',
    meta ->> 'city',
    meta ->> 'pincode',
    meta ->> 'vertical',
    meta ->> 'source',
    nullif(meta ->> 'code', ''),
    meta ->> 'terms_version',
    new.email_confirmed_at
  );
  return new;
end;
$$;

create function public.sync_candidate_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.candidates
  set email_verified_at = new.email_confirmed_at
  where id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_candidate_email_verified() from public, anon, authenticated;

create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sync_candidate_email_verified();
