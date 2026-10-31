-- Partner companies are added by the admin, who may not know the contact's
-- designation. Self-registered companies still have to give one.
alter table public.companies alter column designation drop not null;
