-- Partner jobs outside India (e.g. UAE airports) have no Indian pincode.
-- Property jobs still always get their property's pincode from the trigger.
alter table public.company_jobs alter column pincode drop not null;
