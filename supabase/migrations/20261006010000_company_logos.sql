alter table public.companies
  add column logo_path text,
  add constraint companies_logo_path_own_folder
    check (logo_path is null or logo_path like id::text || '/%');

-- Public: logos are shown to everyone on job postings, so they're served
-- without signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  true,
  1048576,
  array['image/webp', 'image/jpeg']
);

-- Storage needs select on an object to delete it, even in a public bucket.
create policy "Companies read their own logo"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Companies upload their own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Companies delete their own logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function public.delete_files_for_company()
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
    raise warning 'Files for deleted company % were kept: Vault secrets project_url and storage_secret_key are not set.', old.id;
    return old;
  end if;

  for file in
    select bucket_id, name from storage.objects
    where bucket_id in ('company-proofs', 'company-logos')
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
