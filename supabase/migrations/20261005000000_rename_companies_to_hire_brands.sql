alter table public.companies rename to hire_brands;

alter table public.hire_brands rename constraint companies_pkey to hire_brands_pkey;
alter table public.hire_brands rename constraint companies_name_key to hire_brands_name_key;
alter table public.hire_brands rename constraint companies_name_check to hire_brands_name_check;
alter table public.hire_brands rename constraint companies_sector_check to hire_brands_sector_check;

alter policy "Anyone can read companies" on public.hire_brands
  rename to "Anyone can read hire brands";
