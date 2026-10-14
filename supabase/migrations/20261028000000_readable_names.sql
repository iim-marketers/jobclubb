-- candidate_name must never be selected by a company-facing query.

alter table public.company_jobs add column company_name text;
alter table public.candidate_resumes add column candidate_name text;
alter table public.membership_payments add column candidate_name text;
alter table public.membership_reminders add column candidate_name text;
alter table public.placements
  add column job_title text,
  add column company_name text,
  add column candidate_name text;
alter table public.placement_documents
  add column job_title text,
  add column company_name text,
  add column candidate_name text;
alter table public.placement_payments
  add column job_title text,
  add column company_name text,
  add column candidate_name text;
alter table public.placement_reminders
  add column job_title text,
  add column company_name text,
  add column candidate_name text;

update public.company_jobs j
set company_name = co.company_name
from public.companies co
where co.id = j.company_id;

update public.candidate_resumes r
set candidate_name = c.first_name || ' ' || c.last_name
from public.candidates c
where c.id = r.candidate_id;

update public.membership_payments p
set candidate_name = c.first_name || ' ' || c.last_name
from public.candidates c
where c.id = p.candidate_id;

update public.membership_reminders r
set candidate_name = c.first_name || ' ' || c.last_name
from public.candidates c
where c.id = r.candidate_id;

update public.placements p
set job_title = a.job_title, company_name = a.company_name, candidate_name = a.candidate_name
from public.job_applications a
where a.id = p.application_id;

update public.placement_documents d
set job_title = p.job_title, company_name = p.company_name, candidate_name = p.candidate_name
from public.placements p
where p.id = d.placement_id;

update public.placement_payments pp
set job_title = p.job_title, company_name = p.company_name, candidate_name = p.candidate_name
from public.placements p
where p.id = pp.placement_id;

update public.placement_reminders r
set job_title = p.job_title, company_name = p.company_name, candidate_name = p.candidate_name
from public.placements p
where p.id = r.placement_id;

alter table public.company_jobs alter column company_name set not null;
alter table public.candidate_resumes alter column candidate_name set not null;
alter table public.membership_payments alter column candidate_name set not null;
alter table public.membership_reminders alter column candidate_name set not null;
alter table public.placements
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;
alter table public.placement_documents
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;
alter table public.placement_payments
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;
alter table public.placement_reminders
  alter column job_title set not null,
  alter column company_name set not null,
  alter column candidate_name set not null;

create or replace function public.company_jobs_property_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select city, pincode, company_name into new.city, new.pincode, new.company_name
  from public.companies
  where id = new.company_id;
  return new;
end;
$$;

create function public.fill_candidate_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select c.first_name || ' ' || c.last_name into new.candidate_name
  from public.candidates c
  where c.id = new.candidate_id;
  return new;
end;
$$;

create function public.placements_fill_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select a.job_title, a.company_name, a.candidate_name
  into new.job_title, new.company_name, new.candidate_name
  from public.job_applications a
  where a.id = new.application_id;
  return new;
end;
$$;

create function public.fill_placement_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select p.job_title, p.company_name, p.candidate_name
  into new.job_title, new.company_name, new.candidate_name
  from public.placements p
  where p.id = new.placement_id;
  return new;
end;
$$;

-- Security definer: companies and candidates rename themselves through RLS,
-- and those roles have no access to the tables being synced.
create function public.sync_company_job_company_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.company_jobs set company_name = new.company_name where company_id = new.id;
  return new;
end;
$$;

create function public.sync_candidate_name_copies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name constant text := new.first_name || ' ' || new.last_name;
begin
  update public.candidate_resumes set candidate_name = full_name where candidate_id = new.id;
  update public.membership_payments set candidate_name = full_name where candidate_id = new.id;
  update public.membership_reminders set candidate_name = full_name where candidate_id = new.id;
  return new;
end;
$$;

-- The job_applications sync triggers already follow renames of jobs,
-- companies and candidates; these pass them on down to placements.
create function public.sync_placement_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.placements
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where application_id = new.id;
  return new;
end;
$$;

create function public.sync_placement_child_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.placement_documents
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where placement_id = new.id;
  update public.placement_payments
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where placement_id = new.id;
  update public.placement_reminders
  set job_title = new.job_title, company_name = new.company_name, candidate_name = new.candidate_name
  where placement_id = new.id;
  return new;
end;
$$;

revoke execute on function public.fill_candidate_name() from public, anon, authenticated;
revoke execute on function public.placements_fill_names() from public, anon, authenticated;
revoke execute on function public.fill_placement_names() from public, anon, authenticated;
revoke execute on function public.sync_company_job_company_name() from public, anon, authenticated;
revoke execute on function public.sync_candidate_name_copies() from public, anon, authenticated;
revoke execute on function public.sync_placement_names() from public, anon, authenticated;
revoke execute on function public.sync_placement_child_names() from public, anon, authenticated;

create trigger candidate_resumes_fill_candidate_name
  before insert on public.candidate_resumes
  for each row execute function public.fill_candidate_name();

create trigger membership_payments_fill_candidate_name
  before insert on public.membership_payments
  for each row execute function public.fill_candidate_name();

create trigger membership_reminders_fill_candidate_name
  before insert on public.membership_reminders
  for each row execute function public.fill_candidate_name();

create trigger placements_fill_names
  before insert on public.placements
  for each row execute function public.placements_fill_names();

create trigger placement_documents_fill_names
  before insert on public.placement_documents
  for each row execute function public.fill_placement_names();

create trigger placement_payments_fill_names
  before insert on public.placement_payments
  for each row execute function public.fill_placement_names();

create trigger placement_reminders_fill_names
  before insert on public.placement_reminders
  for each row execute function public.fill_placement_names();

create trigger on_company_name_changed_jobs
  after update of company_name on public.companies
  for each row
  when (old.company_name is distinct from new.company_name)
  execute function public.sync_company_job_company_name();

create trigger on_candidate_name_changed_copies
  after update of first_name, last_name on public.candidates
  for each row
  when (old.first_name is distinct from new.first_name or old.last_name is distinct from new.last_name)
  execute function public.sync_candidate_name_copies();

create trigger on_job_application_names_changed_placements
  after update of job_title, company_name, candidate_name on public.job_applications
  for each row
  when (
    old.job_title is distinct from new.job_title
    or old.company_name is distinct from new.company_name
    or old.candidate_name is distinct from new.candidate_name
  )
  execute function public.sync_placement_names();

create trigger on_placement_names_changed
  after update of job_title, company_name, candidate_name on public.placements
  for each row
  when (
    old.job_title is distinct from new.job_title
    or old.company_name is distinct from new.company_name
    or old.candidate_name is distinct from new.candidate_name
  )
  execute function public.sync_placement_child_names();
