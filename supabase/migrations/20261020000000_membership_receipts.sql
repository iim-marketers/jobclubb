-- Whichever confirmation claims this first sends the receipt, so it goes out once.
alter table public.membership_payments
  add column receipt_sent_at timestamptz;

update public.membership_payments
set receipt_sent_at = paid_at
where status = 'paid';
