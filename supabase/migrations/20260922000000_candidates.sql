create table public.candidates (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (length(first_name) between 1 and 80),
  last_name text not null check (length(last_name) between 1 and 80),
  email text not null,
  phone text not null,
  city text not null check (length(city) between 1 and 80),
  pincode text not null check (pincode ~ '^\d{6}$'),
  vertical text not null,
  source text not null,
  code text check (code ~ '^[A-Z0-9-]{4,24}$'),
  student_id_path text,
  student_id_status text check (student_id_status in ('pending', 'approved', 'rejected')),
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.candidates enable row level security;

revoke all on public.candidates from anon, authenticated;
grant select, insert, update, delete on public.candidates to service_role;
grant select on public.candidates to authenticated;
grant update (first_name, last_name, phone, city, pincode, vertical)
  on public.candidates to authenticated;

create policy "Candidates read their own profile"
  on public.candidates for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Candidates update their own profile"
  on public.candidates for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_candidate()
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
    source, code, terms_version
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
    meta ->> 'terms_version'
  );
  return new;
end;
$$;

create trigger on_auth_user_created_candidate
  after insert on auth.users
  for each row execute function public.handle_new_candidate();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-ids',
  'student-ids',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy "Candidates read their own student ID"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-ids'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
