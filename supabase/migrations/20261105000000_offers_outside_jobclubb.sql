-- Only membership is paid on JobClubb. Any placement fee is settled outside it,
-- and the placement team sends the offer letter once the candidate has agreed,
-- so an offer no longer waits on a payment deadline. Paid placement_payments
-- rows stay for their invoices.
alter table public.placements
  drop constraint placements_release_terms,
  add constraint placements_release_terms check (
    released_at is null or (monthly_salary is not null and joining_date is not null)
  ),
  drop column fee_amount;

drop function public.mark_placement_paid(text, uuid, text);
drop function public.expire_placements();

delete from public.placement_payments where status <> 'paid';
delete from public.placement_reminders where kind <> 'offer_upload';

create or replace function public.claim_placement_reminders()
returns table (placement_id uuid, kind text, for_date date)
language sql
set search_path = ''
as $$
  insert into public.placement_reminders as r (placement_id, kind, for_date)
  select p.id, 'offer_upload', (p.selected_at at time zone 'Asia/Kolkata')::date
  from public.placements p
  where p.status = 'awaiting_offer' and p.selected_at <= now() - interval '2 days'
  on conflict do nothing
  returning r.placement_id, r.kind, r.for_date;
$$;
