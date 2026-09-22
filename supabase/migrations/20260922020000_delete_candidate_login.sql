create function public.delete_login_for_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- When the delete started from auth.users, that row is already gone and
  -- this matches nothing.
  delete from auth.users where id = old.id;
  return old;
end;
$$;

revoke execute on function public.delete_login_for_candidate() from public, anon, authenticated;

create trigger on_candidate_deleted
  after delete on public.candidates
  for each row execute function public.delete_login_for_candidate();
