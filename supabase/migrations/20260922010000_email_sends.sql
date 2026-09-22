create table public.email_sends (
  id bigint generated always as identity primary key,
  email text not null,
  kind text not null check (kind in ('confirm_signup')),
  sent_at timestamptz not null default now()
);

create index email_sends_email_sent_at_idx on public.email_sends (email, sent_at desc);

alter table public.email_sends enable row level security;

revoke all on public.email_sends from anon, authenticated;
grant select, insert, delete on public.email_sends to service_role;
