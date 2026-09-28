alter table public.candidates
  add column photo_path text,
  add constraint candidates_photo_path_own_folder
    check (photo_path is null or photo_path like id::text || '/%');

grant update (photo_path) on public.candidates to authenticated;

-- Private: the terms promise employers never see a photo before the candidate
-- agrees to reveal it, so photos are only ever served through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  false,
  1048576,
  array['image/webp', 'image/jpeg']
);

create policy "Candidates read their own photo"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Candidates upload their own photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'candidate-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Candidates delete their own photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
