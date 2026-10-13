create extension if not exists pg_cron;
create extension if not exists pg_net;

-- scheduled_at is when the candidate last got the scheduled or rescheduled
-- email; the app resets both columns on every save.
alter table public.job_interviews
  add column scheduled_at timestamptz not null default now(),
  add column reminder_sent_at timestamptz;

-- Marks reminders sent before they go out, so overlapping runs can't send one
-- twice. Interviews booked less than 24 hours ahead are skipped: the scheduled
-- email went out moments ago.
create function public.claim_interview_reminders()
returns setof uuid
language sql
set search_path = ''
as $$
  update public.job_interviews
  set reminder_sent_at = now()
  where cancelled_at is null
    and outcome is null
    and reminder_sent_at is null
    and starts_at > now()
    and starts_at <= now() + interval '24 hours'
    and scheduled_at <= starts_at - interval '24 hours'
  returning id;
$$;

revoke execute on function public.claim_interview_reminders() from public, anon, authenticated;
grant execute on function public.claim_interview_reminders() to service_role;

-- The app sends the emails, so the cron job only calls its endpoint.
-- Needs two Vault secrets, created once per project in the SQL Editor:
--   select vault.create_secret('https://www.jobclubb.com', 'site_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
create function public.request_interview_reminders()
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
    raise warning 'Interview reminders skipped: Vault secrets site_url and cron_secret are not set.';
    return;
  end if;

  perform net.http_post(
    url := rtrim(site_url, '/') || '/api/cron/interview-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || cron_secret),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.request_interview_reminders() from public, anon, authenticated;

select cron.schedule(
  'interview-reminders',
  '*/15 * * * *',
  'select public.request_interview_reminders()'
);
