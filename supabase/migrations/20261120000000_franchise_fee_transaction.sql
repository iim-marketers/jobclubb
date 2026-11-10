-- 20261119000000 was applied before its final edits. This brings any database
-- that ran an earlier draft in line with it; on a fresh database it's a no-op
-- apart from naming the approval check.

alter table public.franchises
  add column if not exists fee_transaction_id text
    check (length(fee_transaction_id) between 3 and 60),
  drop column if exists notes;

alter table public.franchises drop constraint if exists franchises_fee_payment_mode_check;
alter table public.franchises
  add constraint franchises_fee_payment_mode_check
    check (length(fee_payment_mode) between 2 and 120);

alter table public.franchises drop constraint if exists franchises_area_sqft_check;
alter table public.franchises
  alter column area_sqft set not null,
  add constraint franchises_area_sqft_check check (area_sqft between 200 and 100000);

-- The draft's unnamed "approved means complete" check didn't cover the fee payment.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.franchises'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%code IS NOT NULL%'
  loop
    execute format('alter table public.franchises drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.franchises
  add constraint franchises_approved_complete check (
    status <> 'approved'
    or (
      code is not null and territory is not null and starts_on is not null and ends_on is not null
      and fee_payment_mode is not null and fee_transaction_id is not null
    )
  );
