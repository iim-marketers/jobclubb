-- One row per Razorpay order. The server creates it with the price it charged,
-- so verifying a payment never trusts an amount or plan sent by the browser.
create table public.membership_payments (
  order_id text primary key,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  plan text not null check (plan in ('member', 'franchise')),
  amount integer not null check (amount >= 100),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid')),
  payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((status = 'paid') = (payment_id is not null and paid_at is not null))
);

create index membership_payments_candidate_id_idx
  on public.membership_payments (candidate_id);

alter table public.membership_payments enable row level security;

revoke all on public.membership_payments from anon, authenticated;
grant select, insert, update, delete on public.membership_payments to service_role;
