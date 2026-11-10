-- An approved franchise must record when its fee was received, too.
alter table public.franchises drop constraint if exists franchises_approved_complete;

alter table public.franchises
  add constraint franchises_approved_complete check (
    status <> 'approved'
    or (
      code is not null and territory is not null and starts_on is not null and ends_on is not null
      and fee_paid_on is not null and fee_payment_mode is not null and fee_transaction_id is not null
    )
  );
