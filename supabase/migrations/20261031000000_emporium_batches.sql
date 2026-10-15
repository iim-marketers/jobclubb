-- Emporium institutes run batches of students. Each batch gets one sign-up
-- code (JC-EM-…) good for `seats` candidates, who get a year of membership
-- without paying. A seat is taken by the candidate row itself, so deleting
-- the candidate frees it.

create table public.emporium_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 80),
  created_at timestamptz not null default now()
);

create unique index emporium_locations_name_idx on public.emporium_locations (lower(name));

create table public.emporium_batches (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.emporium_locations (id) on delete restrict,
  batch_no integer not null check (batch_no between 1 and 999),
  code text not null unique check (code ~ '^JC-EM-[A-Z0-9-]{4,18}$'),
  seats integer not null check (seats between 1 and 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (location_id, batch_no)
);

alter table public.emporium_locations enable row level security;
alter table public.emporium_batches enable row level security;

revoke all on public.emporium_locations from anon, authenticated;
revoke all on public.emporium_batches from anon, authenticated;
grant select, insert, update, delete on public.emporium_locations to service_role;
grant select, insert, update, delete on public.emporium_batches to service_role;

alter table public.candidates
  add column emporium_batch_id uuid references public.emporium_batches (id) on delete restrict;

create index candidates_emporium_batch_id_idx on public.candidates (emporium_batch_id)
  where emporium_batch_id is not null;

alter table public.candidates
  drop constraint candidates_membership_plan_check,
  add constraint candidates_membership_plan_check
    check (membership_plan in ('member', 'franchise', 'emporium')),
  add constraint candidates_emporium_plan_requires_batch
    check (membership_plan is distinct from 'emporium' or emporium_batch_id is not null);

-- Finds or creates the location and adds the batch in one transaction.
create function public.create_emporium_batch(
  p_location text,
  p_batch_no integer,
  p_seats integer,
  p_code text
)
returns setof public.emporium_batches
language plpgsql
set search_path = ''
as $$
declare
  v_location_id uuid;
begin
  select id into v_location_id from public.emporium_locations
  where lower(name) = lower(p_location);

  if not found then
    insert into public.emporium_locations (name) values (p_location)
    returning id into v_location_id;
  end if;

  return query
  insert into public.emporium_batches (location_id, batch_no, seats, code)
  values (v_location_id, p_batch_no, p_seats, p_code)
  returning *;
end;
$$;

revoke execute on function public.create_emporium_batch(text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.create_emporium_batch(text, integer, integer, text) to service_role;

-- Returns nothing when the batch already has more students than p_seats.
create function public.set_emporium_batch_seats(p_id uuid, p_seats integer)
returns setof public.emporium_batches
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.emporium_batches where id = p_id for update;

  return query
  update public.emporium_batches
  set seats = p_seats
  where id = p_id
    and p_seats >= (select count(*) from public.candidates where emporium_batch_id = p_id)
  returning *;
end;
$$;

revoke execute on function public.set_emporium_batch_seats(uuid, integer) from public, anon, authenticated;
grant execute on function public.set_emporium_batch_seats(uuid, integer) to service_role;

-- The batch row is locked while its seats are counted, so two students
-- signing up at once can't both take the last seat. A full, paused or unknown
-- emporium code fails the whole sign-up: the app checks first and shows why.
create or replace function public.handle_new_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  v_code text := nullif(upper(meta ->> 'code'), '');
  v_batch public.emporium_batches;
  v_used integer;
begin
  if meta ->> 'role' is distinct from 'candidate' then
    return new;
  end if;

  if v_code like 'JC-EM-%' then
    select * into v_batch from public.emporium_batches where code = v_code for update;
    if not found then
      raise exception 'emporium_code_invalid' using errcode = 'P0001';
    end if;
    if not v_batch.active then
      raise exception 'emporium_code_paused' using errcode = 'P0001';
    end if;
    select count(*) into v_used from public.candidates where emporium_batch_id = v_batch.id;
    if v_used >= v_batch.seats then
      raise exception 'emporium_code_full' using errcode = 'P0001';
    end if;
  end if;

  insert into public.candidates (
    id, first_name, last_name, email, phone, city, pincode, industry,
    source, code, terms_version, email_verified_at,
    emporium_batch_id, membership_plan, membership_expires_at
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
    v_code,
    meta ->> 'terms_version',
    new.email_confirmed_at,
    v_batch.id,
    case when v_batch.id is not null then 'emporium' end,
    case when v_batch.id is not null then now() + interval '365 days' end
  );
  return new;
end;
$$;
