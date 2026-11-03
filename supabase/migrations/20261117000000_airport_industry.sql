-- Keep in sync with INDUSTRIES in src/lib/taxonomy.ts.
alter table public.companies drop constraint companies_industry_check;
alter table public.companies
  add constraint companies_industry_check check (
    industry in (
      'all', 'airlines', 'airport', 'hotels', 'restaurants', 'cafes',
      'bars-nightclubs', 'cruise-lines', 'travel-tourism'
    )
  ) not valid;

alter table public.company_jobs drop constraint company_jobs_industry_check;
alter table public.company_jobs
  add constraint company_jobs_industry_check check (
    industry in (
      'airlines', 'airport', 'hotels', 'restaurants', 'cafes',
      'bars-nightclubs', 'cruise-lines', 'travel-tourism'
    )
  ) not valid;
