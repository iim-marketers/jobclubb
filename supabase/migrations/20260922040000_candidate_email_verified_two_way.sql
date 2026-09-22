create function public.sync_auth_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Both sync triggers fire only on a real change, so the round trip stops after one hop.
  update auth.users
  set email_confirmed_at = new.email_verified_at
  where id = new.id
    and email_confirmed_at is distinct from new.email_verified_at;

  if new.email_verified_at is null then
    delete from auth.sessions where user_id = new.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.sync_auth_email_confirmed() from public, anon, authenticated;

create trigger on_candidate_email_verified_changed
  after update of email_verified_at on public.candidates
  for each row
  when (old.email_verified_at is distinct from new.email_verified_at)
  execute function public.sync_auth_email_confirmed();
