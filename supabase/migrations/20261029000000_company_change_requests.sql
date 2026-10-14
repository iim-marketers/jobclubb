-- company_name is the name when the request was made, kept as a record.

create table public.company_change_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  company_name text not null,
  field text not null check (field in ('company_name', 'city', 'gstin')),
  old_value text,
  new_value text not null check (length(new_value) between 1 and 120),
  reason text not null check (length(reason) between 1 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text check (length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index company_change_requests_one_pending_idx
  on public.company_change_requests (company_id, field)
  where status = 'pending';

create index company_change_requests_status_created_at_idx
  on public.company_change_requests (status, created_at desc);

alter table public.company_change_requests enable row level security;

revoke all on public.company_change_requests from anon, authenticated;
grant select, insert, update, delete on public.company_change_requests to service_role;

-- Applies the change and closes the request together, so neither can happen alone.
create function public.approve_company_change(p_id uuid)
returns setof public.company_change_requests
language plpgsql
set search_path = ''
as $$
declare
  request public.company_change_requests;
begin
  select * into request from public.company_change_requests
  where id = p_id and status = 'pending'
  for update;
  if not found then return; end if;

  if request.field = 'company_name' then
    update public.companies set company_name = request.new_value where id = request.company_id;
  elsif request.field = 'city' then
    update public.companies set city = request.new_value where id = request.company_id;
  elsif request.field = 'gstin' then
    update public.companies set gstin = request.new_value where id = request.company_id;
  end if;

  return query
  update public.company_change_requests
  set status = 'approved', reviewed_at = now()
  where id = p_id
  returning *;
end;
$$;

revoke execute on function public.approve_company_change(uuid) from public, anon, authenticated;
grant execute on function public.approve_company_change(uuid) to service_role;
