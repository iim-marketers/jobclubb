-- The candidate isn't told they were selected until the offer is released.
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.job_applications (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  status text not null default 'awaiting_offer' check (status in (
    'awaiting_offer', 'offer_received', 'released', 'accepted',
    'joined', 'not_joined', 'expired', 'declined', 'withdrawn'
  )),
  -- Paise. The fee is fixed from monthly_salary when the offer is released.
  monthly_salary integer check (monthly_salary between 100 and 100000000),
  fee_amount integer check (fee_amount >= 100),
  joining_date date,
  offer_deadline date,
  offer_notes text check (length(offer_notes) <= 2000),
  admin_notes text check (length(admin_notes) <= 4000),
  selected_at timestamptz not null,
  offer_received_at timestamptz,
  released_at timestamptz,
  accepted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint placements_release_terms check (
    released_at is null
    or (fee_amount is not null and monthly_salary is not null
        and joining_date is not null and offer_deadline is not null)
  ),
  constraint placements_released check (
    status in ('awaiting_offer', 'offer_received', 'withdrawn') or released_at is not null
  ),
  constraint placements_accepted check (
    status not in ('accepted', 'joined', 'not_joined') or accepted_at is not null
  ),
  constraint placements_closed check (
    (status in ('joined', 'not_joined', 'expired', 'declined', 'withdrawn')) = (closed_at is not null)
  )
);

create index placements_company_id_idx on public.placements (company_id, selected_at desc);
create index placements_candidate_id_idx on public.placements (candidate_id);
create index placements_status_idx on public.placements (status);

alter table public.placements enable row level security;
revoke all on public.placements from anon, authenticated;
grant select, insert, update, delete on public.placements to service_role;

create table public.placement_documents (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements (id) on delete cascade,
  path text not null unique,
  name text not null check (length(name) between 1 and 200),
  size integer not null check (size > 0),
  content_type text not null,
  uploaded_by text not null check (uploaded_by in ('company', 'admin')),
  created_at timestamptz not null default now()
);

create index placement_documents_placement_id_idx on public.placement_documents (placement_id);

alter table public.placement_documents enable row level security;
revoke all on public.placement_documents from anon, authenticated;
grant select, insert, update, delete on public.placement_documents to service_role;

-- No storage policies: only the server reads or writes offer documents, and
-- candidates get short-lived signed links once they've paid.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'placement-documents',
  'placement-documents',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
);

-- Same Storage API route as delete_files_for_candidate(); covers documents
-- removed directly and those cascaded from a deleted placement, company or candidate.
create function public.delete_placement_document_file()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  secret_key text;
begin
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret_key
    from vault.decrypted_secrets where name = 'storage_secret_key';

  if project_url is null or secret_key is null then
    raise warning 'Offer document % was kept: Vault secrets project_url and storage_secret_key are not set.', old.path;
    return old;
  end if;

  perform net.http_delete(
    url := rtrim(project_url, '/') || '/storage/v1/object/placement-documents/' || old.path,
    headers := jsonb_build_object('apikey', secret_key, 'Authorization', 'Bearer ' || secret_key)
  );
  return old;
end;
$$;

revoke execute on function public.delete_placement_document_file() from public, anon, authenticated;

create trigger on_placement_document_deleted
  after delete on public.placement_documents
  for each row execute function public.delete_placement_document_file();

create function public.job_interviews_create_placement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.placements (application_id, company_id, candidate_id, selected_at)
  values (new.application_id, new.company_id, new.candidate_id, new.outcome_at)
  on conflict (application_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.job_interviews_create_placement() from public, anon, authenticated;

create trigger job_interviews_create_placement
  after update of outcome on public.job_interviews
  for each row
  when (old.outcome is distinct from new.outcome and new.outcome = 'selected')
  execute function public.job_interviews_create_placement();

insert into public.placements (application_id, company_id, candidate_id, selected_at)
select i.application_id, i.company_id, i.candidate_id, i.outcome_at
from public.job_interviews i
join public.job_applications a on a.id = i.application_id
where i.outcome = 'selected' and a.status = 'active'
on conflict (application_id) do nothing;

-- Releasing moves the application to the Offer stage. Withdrawing before the
-- release reads to the candidate as not selected, since they never saw it.
create function public.placements_after_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.released_at is null and new.released_at is not null then
    update public.job_applications
    set stage = 4, updated_at = now()
    where id = new.application_id and status = 'active';
  end if;
  if new.status = 'withdrawn' and old.status <> 'withdrawn' and new.released_at is null then
    update public.job_applications
    set status = 'rejected', rejected_at = new.closed_at, updated_at = now()
    where id = new.application_id and status = 'active';
  end if;
  return new;
end;
$$;

revoke execute on function public.placements_after_update() from public, anon, authenticated;

create trigger placements_after_update
  after update of released_at, status on public.placements
  for each row execute function public.placements_after_update();

-- The deadline is a date in IST; it ends at the following midnight.
create function public.placement_deadline_end(deadline date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select ((deadline + 1)::timestamp at time zone 'Asia/Kolkata');
$$;

grant execute on function public.placement_deadline_end(date) to service_role;

-- One row per Razorpay order, created with the fee the server charged.
create table public.placement_payments (
  order_id text primary key,
  placement_id uuid not null references public.placements (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  amount integer not null check (amount >= 100),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid')),
  payment_id text unique,
  invoice_number text unique,
  billing_name text not null check (length(billing_name) between 1 and 161),
  billing_city text not null check (length(billing_city) between 1 and 80),
  billing_pincode text not null check (billing_pincode ~ '^\d{6}$'),
  place_of_supply text not null check (place_of_supply ~ '^\d{2}$'),
  taxable_amount integer not null check (taxable_amount > 0),
  cgst_amount integer not null check (cgst_amount >= 0),
  sgst_amount integer not null check (sgst_amount >= 0),
  igst_amount integer not null check (igst_amount >= 0),
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((status = 'paid') = (payment_id is not null and paid_at is not null)),
  constraint placement_payments_paid_has_invoice check (status <> 'paid' or invoice_number is not null),
  constraint placement_payments_gst_total check (
    taxable_amount + cgst_amount + sgst_amount + igst_amount = amount
  )
);

create index placement_payments_placement_id_idx on public.placement_payments (placement_id);
create index placement_payments_candidate_id_idx on public.placement_payments (candidate_id);

alter table public.placement_payments enable row level security;
revoke all on public.placement_payments from anon, authenticated;
grant select, insert, update, delete on public.placement_payments to service_role;

-- Marks the order paid, issues its invoice number (shared with membership
-- invoices) and accepts the offer, in one transaction. A checkout started before
-- the deadline still counts if it completes within a day of it, in case the
-- expiry job ran while it was in flight.
create function public.mark_placement_paid(
  p_order_id text,
  p_candidate_id uuid,
  p_payment_id text
)
returns setof public.placement_payments
language plpgsql
set search_path = ''
as $$
declare
  paid timestamptz := now();
  payment public.placement_payments;
begin
  select * into payment from public.placement_payments
  where order_id = p_order_id
    and candidate_id = p_candidate_id
    and status = 'created'
  for update;
  if not found then return; end if;

  update public.placements
  set status = 'accepted', accepted_at = paid, closed_at = null, updated_at = paid
  where id = payment.placement_id
    and (
      status = 'released'
      or (status = 'expired'
          and payment.created_at < public.placement_deadline_end(offer_deadline)
          and paid < public.placement_deadline_end(offer_deadline) + interval '1 day')
    );

  return query
  update public.placement_payments
  set status = 'paid',
      payment_id = p_payment_id,
      paid_at = paid,
      invoice_number = public.next_invoice_number(paid)
  where order_id = p_order_id
  returning *;
end;
$$;

revoke execute on function public.mark_placement_paid(text, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_placement_paid(text, uuid, text) to service_role;

create function public.expire_placements()
returns setof uuid
language sql
set search_path = ''
as $$
  update public.placements
  set status = 'expired', closed_at = now(), updated_at = now()
  where status = 'released' and public.placement_deadline_end(offer_deadline) <= now()
  returning id;
$$;

revoke execute on function public.expire_placements() from public, anon, authenticated;
grant execute on function public.expire_placements() to service_role;

-- Keyed on the date each reminder is for, so extending a deadline makes its
-- payment reminders due again.
create table public.placement_reminders (
  placement_id uuid not null references public.placements (id) on delete cascade,
  kind text not null check (kind in ('offer_upload', 'payment_3d', 'payment_1d')),
  for_date date not null,
  sent_at timestamptz not null default now(),
  primary key (placement_id, kind, for_date)
);

alter table public.placement_reminders enable row level security;
revoke all on public.placement_reminders from anon, authenticated;
grant select, insert, update, delete on public.placement_reminders to service_role;

create function public.claim_placement_reminders()
returns table (placement_id uuid, kind text, for_date date)
language sql
set search_path = ''
as $$
  insert into public.placement_reminders as r (placement_id, kind, for_date)
  select p.id, w.kind, p.offer_deadline
  from public.placements p
  cross join (values ('payment_3d', 3, 1), ('payment_1d', 1, 0)) as w (kind, days, until_days)
  where p.status = 'released'
    and public.placement_deadline_end(p.offer_deadline) <= now() + make_interval(days => w.days)
    and public.placement_deadline_end(p.offer_deadline) > now() + make_interval(days => w.until_days)
  union all
  select p.id, 'offer_upload', (p.selected_at at time zone 'Asia/Kolkata')::date
  from public.placements p
  where p.status = 'awaiting_offer' and p.selected_at <= now() - interval '2 days'
  on conflict do nothing
  returning r.placement_id, r.kind, r.for_date;
$$;

revoke execute on function public.claim_placement_reminders() from public, anon, authenticated;
grant execute on function public.claim_placement_reminders() to service_role;

select cron.schedule(
  'placements',
  '5 * * * *',
  $$select public.request_cron('/api/cron/placements')$$
);
