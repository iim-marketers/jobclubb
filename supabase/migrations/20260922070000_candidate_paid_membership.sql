-- There's no free plan: every candidate pays for a year of membership after
-- verifying their email. The price comes from their sign-up code, and only the
-- server (service role) records a plan, when payment completes.
update public.candidates set membership_plan = null where membership_plan = 'free';

alter table public.candidates
  drop constraint candidates_membership_plan_check,
  add constraint candidates_membership_plan_check
    check (membership_plan in ('member', 'franchise')),
  add column membership_paid_at timestamptz,
  add column membership_expires_at timestamptz;

revoke update (membership_plan) on public.candidates from authenticated;
