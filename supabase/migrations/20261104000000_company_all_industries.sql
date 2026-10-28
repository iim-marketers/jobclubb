-- Keep in sync with INDUSTRIES in src/lib/taxonomy.ts. 'all' is company-only:
-- every job is posted under one concrete industry.
alter table public.companies
  add constraint companies_industry_check check (
    industry in (
      'all', 'airlines', 'hotels', 'restaurants', 'cafes', 'bars-nightclubs',
      'cruise-lines', 'travel-tourism'
    )
  ) not valid;

alter table public.company_jobs
  add constraint company_jobs_industry_check check (
    industry in (
      'airlines', 'hotels', 'restaurants', 'cafes', 'bars-nightclubs',
      'cruise-lines', 'travel-tourism'
    )
  ) not valid;
