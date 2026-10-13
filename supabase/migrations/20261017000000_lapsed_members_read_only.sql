-- membership_expires_at isn't writable by candidates, so checking it on their
-- own row is safe.
drop policy "Candidates update their own profile" on public.candidates;

create policy "Members update their own profile"
  on public.candidates for update
  to authenticated
  using ((select auth.uid()) = id and membership_expires_at > now())
  with check ((select auth.uid()) = id and membership_expires_at > now());

create function public.has_active_membership()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.candidates
    where id = (select auth.uid()) and membership_expires_at > now()
  );
$$;

revoke execute on function public.has_active_membership() from public, anon;
grant execute on function public.has_active_membership() to authenticated;

drop policy "Candidates upload their own photo" on storage.objects;
drop policy "Candidates delete their own photo" on storage.objects;

create policy "Members upload their own photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'candidate-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_active_membership())
  );

create policy "Members delete their own photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_active_membership())
  );
