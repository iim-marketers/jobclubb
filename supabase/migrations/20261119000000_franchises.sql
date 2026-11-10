-- Franchise partners (Franchise Agreement V3). A franchisee signs up with its
-- business details and stays pending until admin approves it, once the
-- agreement is signed: approval sets the Schedule A territory, term and fee and
-- the JC-FR-… code. Admin can also create an approved franchise directly.
-- Candidates never type the code: only the franchise registers them, from its
-- dashboard, after the candidate confirms their email with a one-time code.
--
-- Commission is half of what the candidate actually paid: once on their first
-- membership payment and once on the placement fee, and only while the
-- franchise's agreement is in force.

create table public.franchises (
  id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text check (length(review_note) <= 500),
  reviewed_at timestamptz,
  email_verified_at timestamptz,
  code text unique check (code ~ '^JC-FR-[A-Z0-9]{3,12}$'),
  name text not null check (length(name) between 2 and 80),
  legal_name text not null check (length(legal_name) between 2 and 120),
  constitution text not null
    check (constitution in ('individual', 'proprietorship', 'partnership', 'llp', 'company')),
  pan text not null check (pan ~ '^[A-Z]{5}\d{4}[A-Z]$'),
  gstin text check (gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  owner_name text not null check (length(owner_name) between 1 and 80),
  email text not null unique,
  phone text not null,
  registered_address text not null check (length(registered_address) between 10 and 300),
  outlet_address text not null check (length(outlet_address) between 10 and 300),
  city text not null check (length(city) between 1 and 80),
  pincode text not null check (pincode ~ '^\d{6}$'),
  area_sqft integer not null check (area_sqft between 200 and 100000),
  territory text check (length(territory) between 2 and 500),
  exclusive boolean not null default false,
  -- Paise: ₹3,00,000 before GST for every franchise, paid by bank transfer
  -- outside JobClubb (clauses 3.1, 3.2).
  franchise_fee integer check (franchise_fee between 0 and 10000000000),
  fee_paid_on date,
  fee_payment_mode text check (length(fee_payment_mode) between 2 and 120),
  fee_transaction_id text check (length(fee_transaction_id) between 3 and 60),
  starts_on date,
  ends_on date,
  terminated_on date,
  termination_note text check (length(termination_note) <= 500),
  bank_account_name text check (length(bank_account_name) <= 120),
  bank_name text check (length(bank_name) <= 120),
  bank_account_no text check (bank_account_no ~ '^\d{6,18}$'),
  bank_ifsc text check (bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on > starts_on),
  check (terminated_on is null or terminated_on >= starts_on),
  check (
    status <> 'approved'
    or (
      code is not null and territory is not null and starts_on is not null and ends_on is not null
      and fee_payment_mode is not null and fee_transaction_id is not null
    )
  )
);

alter table public.franchises enable row level security;

revoke all on public.franchises from anon, authenticated;
grant select, insert, update, delete on public.franchises to service_role;
grant select on public.franchises to authenticated;

create policy "Franchises read their own profile"
  on public.franchises for select
  to authenticated
  using ((select auth.uid()) = id);

create function public.sync_franchise_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.franchises set email_verified_at = new.email_confirmed_at where id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_franchise_email_verified() from public, anon, authenticated;

create trigger on_auth_user_email_confirmed_franchise
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sync_franchise_email_verified();

-- The last day the agreement is in force.
create function public.franchise_last_day(f public.franchises)
returns date
language sql
immutable
set search_path = ''
as $$
  select least(f.ends_on, coalesce(f.terminated_on, f.ends_on));
$$;

revoke execute on function public.franchise_last_day(public.franchises) from public, anon, authenticated;
grant execute on function public.franchise_last_day(public.franchises) to service_role;

alter table public.candidates
  add column franchise_id uuid references public.franchises (id) on delete restrict,
  add constraint candidates_one_partner
    check (franchise_id is null or emporium_batch_id is null);

create index candidates_franchise_id_idx on public.candidates (franchise_id)
  where franchise_id is not null;

-- Same as before, plus: a franchise code in sign-up metadata is refused. The
-- franchise route sets franchise_id and code with the service role afterwards,
-- because anyone signing up can write their own metadata.
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

  if v_code like 'JC-FR-%' then
    raise exception 'franchise_code_not_allowed' using errcode = 'P0001';
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

-- A registration the franchise has started, waiting for the candidate's code.
create table public.franchise_registrations (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises (id) on delete cascade,
  email text not null,
  details jsonb not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index franchise_registrations_franchise_idx
  on public.franchise_registrations (franchise_id, created_at desc);

alter table public.franchise_registrations enable row level security;

revoke all on public.franchise_registrations from anon, authenticated;
grant select, insert, update, delete on public.franchise_registrations to service_role;

alter table public.email_sends drop constraint email_sends_kind_check;

alter table public.email_sends
  add constraint email_sends_kind_check
    check (kind in ('confirm_signup', 'reset_password', 'franchise_otp'));

create table public.franchise_payouts (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises (id) on delete restrict,
  amount integer not null check (amount > 0),
  paid_on date not null,
  reference text not null check (length(reference) between 3 and 60),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now()
);

create index franchise_payouts_franchise_idx on public.franchise_payouts (franchise_id, paid_on desc);

alter table public.franchise_payouts enable row level security;

revoke all on public.franchise_payouts from anon, authenticated;
grant select, insert, update, delete on public.franchise_payouts to service_role;

-- Amounts are paise. A reversal row cancels a commission that was already
-- paid out, and is netted off the franchise's next payout (clause 9.6).
create table public.franchise_commissions (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises (id) on delete restrict,
  candidate_id uuid references public.candidates (id) on delete set null,
  candidate_name text not null,
  kind text not null check (kind in ('registration', 'placement', 'reversal')),
  base_amount integer not null check (base_amount > 0),
  amount integer not null check (amount <> 0),
  order_id text unique references public.membership_payments (order_id) on delete set null,
  placement_id uuid unique references public.placements (id) on delete set null,
  reverses_id uuid unique references public.franchise_commissions (id) on delete restrict,
  earned_at timestamptz not null,
  payout_id uuid references public.franchise_payouts (id) on delete restrict,
  reversed_at timestamptz,
  reversal_reason text check (length(reversal_reason) <= 300),
  created_at timestamptz not null default now(),
  check ((kind = 'reversal') = (amount < 0)),
  check ((kind = 'reversal') = (reverses_id is not null)),
  check (kind <> 'reversal' or reversed_at is null),
  check ((reversed_at is null) = (reversal_reason is null))
);

create unique index franchise_commissions_one_registration_idx
  on public.franchise_commissions (candidate_id)
  where kind = 'registration' and candidate_id is not null;

create index franchise_commissions_franchise_idx
  on public.franchise_commissions (franchise_id, earned_at desc);

alter table public.franchise_commissions enable row level security;

revoke all on public.franchise_commissions from anon, authenticated;
grant select, insert, update, delete on public.franchise_commissions to service_role;

-- Clause 9.1: half of the first membership payment of a candidate the
-- franchise registered, if it was paid while the agreement was in force.
-- Renewals earn nothing.
create function public.accrue_franchise_registration_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.candidates;
  v_franchise public.franchises;
  v_paid_on date := (new.paid_at at time zone 'Asia/Kolkata')::date;
begin
  select * into v_candidate from public.candidates where id = new.candidate_id;
  if not found or v_candidate.franchise_id is null then
    return new;
  end if;

  if exists (
    select 1 from public.membership_payments
    where candidate_id = new.candidate_id and status = 'paid' and order_id <> new.order_id
  ) then
    return new;
  end if;

  select * into v_franchise from public.franchises where id = v_candidate.franchise_id;
  if v_paid_on < v_franchise.starts_on or v_paid_on > public.franchise_last_day(v_franchise) then
    return new;
  end if;

  insert into public.franchise_commissions (
    franchise_id, candidate_id, candidate_name, kind, base_amount, amount, order_id, earned_at
  ) values (
    v_franchise.id,
    v_candidate.id,
    v_candidate.first_name || ' ' || v_candidate.last_name,
    'registration',
    new.amount,
    round(new.amount / 2.0),
    new.order_id,
    new.paid_at
  )
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.accrue_franchise_registration_commission() from public, anon, authenticated;

create trigger on_membership_paid_accrue_franchise_commission
  after update of status on public.membership_payments
  for each row
  when (old.status is distinct from 'paid' and new.status = 'paid')
  execute function public.accrue_franchise_registration_commission();

-- What a Fresher or Franchise Candidate paid JobClubb for this placement,
-- outside JobClubb. Paise.
alter table public.placements
  add column candidate_fee_received integer check (candidate_fee_received between 100 and 100000000),
  add column candidate_fee_received_on date,
  add column candidate_fee_reference text check (length(candidate_fee_reference) <= 120),
  add constraint placements_candidate_fee_complete
    check ((candidate_fee_received is null) = (candidate_fee_received_on is null));

-- Records the placement fee and, for a franchise candidate placed and paid
-- while the agreement was in force, sets the franchise's half (clause 9.3).
-- Returns 'commission', 'no_commission', or an error code.
create function public.record_candidate_fee(
  p_placement_id uuid,
  p_amount integer,
  p_received_on date,
  p_reference text
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_placement public.placements;
  v_candidate public.candidates;
  v_franchise public.franchises;
  v_existing public.franchise_commissions;
  v_selected_on date;
begin
  select * into v_placement from public.placements where id = p_placement_id for update;
  if not found then return 'missing'; end if;

  select * into v_candidate from public.candidates where id = v_placement.candidate_id;
  if v_candidate.franchise_id is null and v_candidate.emporium_batch_id is null then
    return 'no_fee';
  end if;

  select * into v_existing from public.franchise_commissions
  where placement_id = p_placement_id for update;
  if found and v_existing.payout_id is not null then
    return 'paid_out';
  end if;

  update public.placements
  set candidate_fee_received = p_amount,
      candidate_fee_received_on = p_received_on,
      candidate_fee_reference = nullif(p_reference, ''),
      updated_at = now()
  where id = p_placement_id;

  if v_candidate.franchise_id is null then
    return 'no_commission';
  end if;

  select * into v_franchise from public.franchises where id = v_candidate.franchise_id;
  v_selected_on := (v_placement.selected_at at time zone 'Asia/Kolkata')::date;
  if v_selected_on < v_franchise.starts_on
    or v_selected_on > public.franchise_last_day(v_franchise)
    or p_received_on > public.franchise_last_day(v_franchise) then
    delete from public.franchise_commissions where placement_id = p_placement_id;
    return 'no_commission';
  end if;

  insert into public.franchise_commissions (
    franchise_id, candidate_id, candidate_name, kind, base_amount, amount, placement_id, earned_at
  ) values (
    v_franchise.id,
    v_candidate.id,
    v_candidate.first_name || ' ' || v_candidate.last_name,
    'placement',
    p_amount,
    round(p_amount / 2.0),
    p_placement_id,
    now()
  )
  on conflict (placement_id) do update
  set base_amount = excluded.base_amount,
      amount = excluded.amount,
      earned_at = excluded.earned_at,
      reversed_at = null,
      reversal_reason = null;
  return 'commission';
end;
$$;

revoke execute on function public.record_candidate_fee(uuid, integer, date, text) from public, anon, authenticated;
grant execute on function public.record_candidate_fee(uuid, integer, date, text) to service_role;

-- An unpaid commission is simply cancelled; a paid one gets a reversal row.
-- Returns 'cancelled', 'reversed', or an error code.
create function public.reverse_franchise_commission(p_id uuid, p_reason text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_row public.franchise_commissions;
begin
  select * into v_row from public.franchise_commissions where id = p_id for update;
  if not found then return 'missing'; end if;
  if v_row.kind = 'reversal' or v_row.reversed_at is not null then return 'already'; end if;

  update public.franchise_commissions
  set reversed_at = now(), reversal_reason = p_reason
  where id = p_id;

  if v_row.payout_id is null then return 'cancelled'; end if;

  insert into public.franchise_commissions (
    franchise_id, candidate_id, candidate_name, kind, base_amount, amount, reverses_id, earned_at
  ) values (
    v_row.franchise_id, v_row.candidate_id, v_row.candidate_name, 'reversal',
    v_row.base_amount, -v_row.amount, v_row.id, now()
  );
  return 'reversed';
end;
$$;

revoke execute on function public.reverse_franchise_commission(uuid, text) from public, anon, authenticated;
grant execute on function public.reverse_franchise_commission(uuid, text) to service_role;

-- Pays everything outstanding. p_expected guards against a commission landing
-- between the admin reading the total and recording the transfer.
create function public.create_franchise_payout(
  p_franchise_id uuid,
  p_expected integer,
  p_paid_on date,
  p_reference text,
  p_note text
)
returns setof public.franchise_payouts
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_payout public.franchise_payouts;
begin
  perform 1 from public.franchises where id = p_franchise_id for update;
  if not found then
    raise exception 'franchise_missing' using errcode = 'P0001';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from public.franchise_commissions
  where franchise_id = p_franchise_id and payout_id is null and reversed_at is null;

  if v_total <= 0 then
    raise exception 'nothing_to_pay' using errcode = 'P0001';
  end if;
  if v_total <> p_expected then
    raise exception 'outstanding_changed' using errcode = 'P0001';
  end if;

  insert into public.franchise_payouts (franchise_id, amount, paid_on, reference, note)
  values (p_franchise_id, v_total, p_paid_on, p_reference, nullif(p_note, ''))
  returning * into v_payout;

  update public.franchise_commissions
  set payout_id = v_payout.id
  where franchise_id = p_franchise_id and payout_id is null and reversed_at is null;

  return next v_payout;
end;
$$;

revoke execute on function public.create_franchise_payout(uuid, integer, date, text, text) from public, anon, authenticated;
grant execute on function public.create_franchise_payout(uuid, integer, date, text, text) to service_role;
