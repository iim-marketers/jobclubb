alter table public.candidate_resumes
  add column uploaded_pdf_path text,
  add column generated_pdf_path text,
  add constraint candidate_resumes_uploaded_pdf_own_folder
    check (uploaded_pdf_path is null or uploaded_pdf_path like candidate_id::text || '/%'),
  add constraint candidate_resumes_generated_pdf_own_folder
    check (generated_pdf_path is null or generated_pdf_path like candidate_id::text || '/%');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-resumes',
  'candidate-resumes',
  true,
  5242880,
  array['application/pdf']
);
