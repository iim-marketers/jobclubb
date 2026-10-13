-- One row per reminder sent. Keyed on the expiry date, so renewing (which sets
-- a new expiry) makes the next cycle's reminders due again.
create table public.membership_reminders (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  expires_at timestamptz not null,
  days_before smallint not null check (days_before in (15, 1)),
  sent_at timestamptz not null default now(),
  primary key (candidate_id, expires_at, days_before)
);

alter table public.membership_reminders enable row level security;

revoke all on public.membership_reminders from anon, authenticated;
grant select, insert, update, delete on public.membership_reminders to service_role;

-- Records reminders before they go out, so overlapping runs can't send one
-- twice. The 15-day reminder stops once a day is left, so a membership already
-- close to expiry gets only the 1-day one.
create function public.claim_membership_reminders()
returns table (candidate_id uuid, expires_at timestamptz, days_before smallint)
language sql
set search_path = ''
as $$
  insert into public.membership_reminders as r (candidate_id, expires_at, days_before)
  select c.id, c.membership_expires_at, w.days_before
  from public.candidates c
  cross join (values (15::smallint, 1), (1::smallint, 0)) as w (days_before, until_days)
  where c.membership_expires_at <= now() + make_interval(days => w.days_before)
    and c.membership_expires_at > now() + make_interval(days => w.until_days)
  on conflict do nothing
  returning r.candidate_id, r.expires_at, r.days_before;
$$;

revoke execute on function public.claim_membership_reminders() from public, anon, authenticated;
grant execute on function public.claim_membership_reminders() to service_role;

-- Generic version of request_interview_reminders(), shared by every cron job.
-- Uses the same Vault secrets: site_url and cron_secret.
create function public.request_cron(path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  site_url text;
  cron_secret text;
begin
  select decrypted_secret into site_url
    from vault.decrypted_secrets where name = 'site_url';
  select decrypted_secret into cron_secret
    from vault.decrypted_secrets where name = 'cron_secret';

  if site_url is null or cron_secret is null then
    raise warning 'Cron request to % skipped: Vault secrets site_url and cron_secret are not set.', path;
    return;
  end if;

  perform net.http_post(
    url := rtrim(site_url, '/') || path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || cron_secret),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.request_cron(text) from public, anon, authenticated;

select cron.schedule(
  'interview-reminders',
  '*/15 * * * *',
  $$select public.request_cron('/api/cron/interview-reminders')$$
);

drop function public.request_interview_reminders();

select cron.schedule(
  'membership-reminders',
  '0 * * * *',
  $$select public.request_cron('/api/cron/membership-reminders')$$
);
