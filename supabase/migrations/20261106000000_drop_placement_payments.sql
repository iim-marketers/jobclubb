-- No placement fee was ever paid on JobClubb before fees moved outside it, so
-- there are no invoices to keep.
drop trigger on_placement_deleted_delete_unpaid_payments on public.placements;
drop function public.delete_unpaid_placement_payments();

create or replace function public.sync_placement_child_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.placement_documents
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where placement_id = new.id;
  update public.placement_reminders
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where placement_id = new.id;
  return new;
end;
$$;

drop table public.placement_payments;

alter table public.placement_reminders
  drop constraint placement_reminders_kind_check,
  add constraint placement_reminders_kind_check check (kind = 'offer_upload');
