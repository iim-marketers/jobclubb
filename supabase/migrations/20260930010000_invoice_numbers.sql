-- GST invoice numbers: JC/<financial year>/<serial>, e.g. JC/26-27/00001.
-- The serial restarts every financial year (April–March, IST). A number is
-- only taken when a payment is confirmed, so abandoned checkouts leave no gaps.
create table public.receipt_counters (
  financial_year text primary key check (financial_year ~ '^\d{2}-\d{2}$'),
  last_number integer not null check (last_number > 0)
);

alter table public.receipt_counters enable row level security;

revoke all on public.receipt_counters from anon, authenticated;
grant select, insert, update on public.receipt_counters to service_role;

alter table public.membership_payments
  add column invoice_number text,
  add constraint membership_payments_invoice_number_unique unique (invoice_number);

create function public.next_invoice_number(issued_at timestamptz)
returns text
language plpgsql
set search_path = ''
as $$
declare
  local_date date := (issued_at at time zone 'Asia/Kolkata')::date;
  start_year int := extract(year from local_date)::int
    - case when extract(month from local_date) < 4 then 1 else 0 end;
  fy text := lpad((start_year % 100)::text, 2, '0') || '-'
    || lpad(((start_year + 1) % 100)::text, 2, '0');
  next_serial int;
begin
  insert into public.receipt_counters as c (financial_year, last_number)
  values (fy, 1)
  on conflict (financial_year) do update set last_number = c.last_number + 1
  returning c.last_number into next_serial;

  return 'JC/' || fy || '/' || lpad(next_serial::text, 5, '0');
end;
$$;

-- Marks an order paid and issues its invoice number in one transaction.
-- Returns no row if the order isn't this candidate's or is already paid.
create function public.mark_membership_paid(
  p_order_id text,
  p_candidate_id uuid,
  p_payment_id text
)
returns setof public.membership_payments
language plpgsql
set search_path = ''
as $$
declare
  paid timestamptz := now();
begin
  -- Locks the row so a concurrent confirmation of the same order waits, then
  -- finds it already paid and doesn't take a second number.
  perform 1 from public.membership_payments
  where order_id = p_order_id
    and candidate_id = p_candidate_id
    and status = 'created'
  for update;
  if not found then return; end if;

  return query
  update public.membership_payments
  set status = 'paid',
      payment_id = p_payment_id,
      paid_at = paid,
      invoice_number = public.next_invoice_number(paid)
  where order_id = p_order_id
  returning *;
end;
$$;

revoke execute on function public.next_invoice_number(timestamptz)
  from public, anon, authenticated;
revoke execute on function public.mark_membership_paid(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.next_invoice_number(timestamptz) to service_role;
grant execute on function public.mark_membership_paid(text, uuid, text) to service_role;

do $$
declare
  payment record;
begin
  for payment in
    select order_id, paid_at from public.membership_payments
    where status = 'paid' and invoice_number is null
    order by paid_at, order_id
  loop
    update public.membership_payments
    set invoice_number = public.next_invoice_number(payment.paid_at)
    where order_id = payment.order_id;
  end loop;
end;
$$;

alter table public.membership_payments
  add constraint membership_payments_paid_has_invoice
    check (status <> 'paid' or invoice_number is not null);
