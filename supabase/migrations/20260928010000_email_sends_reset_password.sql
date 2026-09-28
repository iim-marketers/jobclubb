alter table public.email_sends drop constraint email_sends_kind_check;

alter table public.email_sends
  add constraint email_sends_kind_check check (kind in ('confirm_signup', 'reset_password'));
