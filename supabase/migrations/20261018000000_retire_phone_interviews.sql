-- Phone interviews are retired: their place was the employer's own number,
-- and candidates must never see an employer's contact details. Existing phone
-- rows stay as history (the app never shows their number to candidates), so
-- this blocks new ones instead of tightening the mode check.
create function public.job_interviews_no_phone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mode = 'phone' and (tg_op = 'INSERT' or old.mode <> 'phone') then
    raise exception 'Phone interviews are no longer supported'
      using errcode = 'P0001', hint = 'phone_retired';
  end if;
  return new;
end;
$$;

revoke execute on function public.job_interviews_no_phone() from public, anon, authenticated;

create trigger job_interviews_no_phone
  before insert or update of mode on public.job_interviews
  for each row execute function public.job_interviews_no_phone();
