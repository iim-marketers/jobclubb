-- Featured jobs lead the signed-out home page.
alter table public.company_jobs add column if not exists featured boolean not null default false;
