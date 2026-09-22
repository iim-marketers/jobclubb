create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 120),
  sector text not null check (
    sector in ('Airlines', 'Hotels', 'Cruise Lines', 'Airport & Travel Services', 'Other')
  ),
  logo_path text not null,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

revoke all on public.companies from anon, authenticated;
grant select on public.companies to anon, authenticated;
grant select, insert, update, delete on public.companies to service_role;

create policy "Anyone can read companies"
  on public.companies for select
  to anon, authenticated
  using (true);

-- logo_path is relative to /public.
insert into public.companies (name, sector, logo_path) values
  ('Jet Airways', 'Airlines', '/recruiters/b9.png'),
  ('Qatar Airways', 'Airlines', '/recruiters/el2.webp'),
  ('Emirates', 'Airlines', '/recruiters/el4.webp'),
  ('AirAsia', 'Airlines', '/recruiters/logo11.webp'),
  ('SpiceJet', 'Airlines', '/recruiters/logo9.webp'),

  ('Andaz Delhi', 'Hotels', '/recruiters/a1.png'),
  ('Conrad Bengaluru', 'Hotels', '/recruiters/a4-alt.png'),
  ('Crowne Plaza Chennai Adyar Park', 'Hotels', '/recruiters/a5.png'),
  ('EIH Limited (The Oberoi Group)', 'Hotels', '/recruiters/a9.png'),
  ('Fairmont Jaipur', 'Hotels', '/recruiters/b1.png'),
  ('Four Seasons Bengaluru', 'Hotels', '/recruiters/b2.png'),
  ('Four Seasons Hotel Doha', 'Hotels', '/recruiters/b3.png'),
  ('Four Seasons Hotel Mumbai', 'Hotels', '/recruiters/b4.png'),
  ('Grand Hyatt', 'Hotels', '/recruiters/b5.png'),
  ('Hyatt Regency Mumbai', 'Hotels', '/recruiters/b6.png'),
  ('IHCL', 'Hotels', '/recruiters/b7.png'),
  ('ITC Hotels', 'Hotels', '/recruiters/b8.png'),
  ('JW Marriott Mumbai Juhu', 'Hotels', '/recruiters/c1.png'),
  ('JW Marriott New Delhi Aerocity', 'Hotels', '/recruiters/c2.png'),
  ('JW Marriott Mumbai Sahar', 'Hotels', '/recruiters/c3.png'),
  ('Le Méridien Gurgaon', 'Hotels', '/recruiters/c4.png'),
  ('Marriott Executive Apartments', 'Hotels', '/recruiters/c5.png'),
  ('Novotel Bengaluru Outer Ring Road', 'Hotels', '/recruiters/c6.png'),
  ('Park Hyatt Abu Dhabi', 'Hotels', '/recruiters/c7.png'),
  ('Park Hyatt Hyderabad', 'Hotels', '/recruiters/c8.png'),
  ('The St. Regis Goa', 'Hotels', '/recruiters/c10.png'),
  ('The St. Regis Mumbai', 'Hotels', '/recruiters/d1.png'),
  ('The Oberoi Bengaluru', 'Hotels', '/recruiters/d10.png'),
  ('Taj Lake Palace Udaipur', 'Hotels', '/recruiters/d3.png'),
  ('The Den Bengaluru', 'Hotels', '/recruiters/d5.png'),
  ('The Leela Goa', 'Hotels', '/recruiters/d6.png'),
  ('The Leela Palace Bengaluru', 'Hotels', '/recruiters/d7.png'),
  ('The Oberoi Amarvilas Agra', 'Hotels', '/recruiters/d8.png'),
  ('The Oberoi Beach Resort Al Zorah', 'Hotels', '/recruiters/d9.png'),
  ('The Oberoi Dubai', 'Hotels', '/recruiters/e1.png'),
  ('The Oberoi Rajvilas Jaipur', 'Hotels', '/recruiters/e2.png'),
  ('The Park Hotels', 'Hotels', '/recruiters/e3.png'),
  ('The Ritz-Carlton Bangalore', 'Hotels', '/recruiters/e4.png'),
  ('The Ritz-Carlton Pune', 'Hotels', '/recruiters/e5.png'),
  ('The Westin Mumbai Garden City', 'Hotels', '/recruiters/e6.png'),
  ('Westin Hotels & Resorts', 'Hotels', '/recruiters/e7.png'),
  ('Novotel Hotels & Resorts', 'Hotels', '/recruiters/logo10.png'),
  ('Holiday Inn', 'Hotels', '/recruiters/logo15.png'),
  ('Radisson Hotels & Resorts', 'Hotels', '/recruiters/logo8.png'),

  ('Carnival Support Services India', 'Cruise Lines', '/recruiters/a3.png'),

  ('Encalm', 'Airport & Travel Services', '/recruiters/a10.png'),
  ('Delhi Duty Free', 'Airport & Travel Services', '/recruiters/a6.png'),
  ('Travel Food Services', 'Airport & Travel Services', '/recruiters/d4.png'),

  ('Apollo Health City', 'Other', '/recruiters/a2.png'),
  ('DIWA', 'Other', '/recruiters/a7.png'),
  ('DLF', 'Other', '/recruiters/a8-alt.png'),
  ('Jio World Centre', 'Other', '/recruiters/b10.png'),
  ('Sevens Holding', 'Other', '/recruiters/c9.png'),
  ('Sula Vineyards', 'Other', '/recruiters/d2.png');
