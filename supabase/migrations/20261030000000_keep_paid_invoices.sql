-- Paid orders are GST invoices and must outlive the account that paid them.
alter table public.membership_payments
  alter column candidate_id drop not null,
  drop constraint membership_payments_candidate_id_fkey,
  add constraint membership_payments_candidate_id_fkey
    foreign key (candidate_id) references public.candidates (id) on delete set null;

alter table public.placement_payments
  alter column candidate_id drop not null,
  alter column placement_id drop not null,
  drop constraint placement_payments_candidate_id_fkey,
  add constraint placement_payments_candidate_id_fkey
    foreign key (candidate_id) references public.candidates (id) on delete set null,
  drop constraint placement_payments_placement_id_fkey,
  add constraint placement_payments_placement_id_fkey
    foreign key (placement_id) references public.placements (id) on delete set null;

create function public.delete_unpaid_membership_payments()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.membership_payments where candidate_id = old.id and status <> 'paid';
  return old;
end;
$$;

create function public.delete_unpaid_placement_payments()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.placement_payments where placement_id = old.id and status <> 'paid';
  return old;
end;
$$;

revoke execute on function public.delete_unpaid_membership_payments() from public, anon, authenticated;
revoke execute on function public.delete_unpaid_placement_payments() from public, anon, authenticated;

create trigger on_candidate_deleted_delete_unpaid_payments
  before delete on public.candidates
  for each row execute function public.delete_unpaid_membership_payments();

create trigger on_placement_deleted_delete_unpaid_payments
  before delete on public.placements
  for each row execute function public.delete_unpaid_placement_payments();
