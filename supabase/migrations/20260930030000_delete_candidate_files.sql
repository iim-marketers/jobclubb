create extension if not exists pg_net;

-- Supabase blocks deleting from storage.objects in SQL (it would orphan the
-- stored files), so this goes through the Storage API with pg_net. Requests
-- are queued with the transaction and only sent once the delete commits.
--
-- Needs two Vault secrets, created once per project in the SQL Editor:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<SUPABASE_SECRET_KEY>', 'storage_secret_key');
create function public.delete_files_for_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  secret_key text;
  file record;
begin
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret_key
    from vault.decrypted_secrets where name = 'storage_secret_key';

  if project_url is null or secret_key is null then
    raise warning 'Files for deleted candidate % were kept: Vault secrets project_url and storage_secret_key are not set.', old.id;
    return old;
  end if;

  for file in
    select bucket_id, name from storage.objects
    where bucket_id in ('candidate-photos', 'candidate-resumes', 'student-ids')
      and name like old.id::text || '/%'
  loop
    perform net.http_delete(
      url := rtrim(project_url, '/') || '/storage/v1/object/' || file.bucket_id || '/' || file.name,
      headers := jsonb_build_object('apikey', secret_key, 'Authorization', 'Bearer ' || secret_key)
    );
  end loop;

  return old;
end;
$$;

revoke execute on function public.delete_files_for_candidate() from public, anon, authenticated;

create trigger on_candidate_deleted_delete_files
  after delete on public.candidates
  for each row execute function public.delete_files_for_candidate();
