alter table public.candidates
  add column preferred_roles text[] not null default '{}'
    check (cardinality(preferred_roles) <= 5);

grant update (preferred_roles) on public.candidates to authenticated;
