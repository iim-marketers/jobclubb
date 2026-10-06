-- Descriptions are now stored as HTML from the rich text editor. The app caps
-- the visible text at 4,000 characters; this leaves room for the markup.
alter table public.company_jobs
  drop constraint company_jobs_description_check,
  add constraint company_jobs_description_check
    check (length(description) between 30 and 20000);
