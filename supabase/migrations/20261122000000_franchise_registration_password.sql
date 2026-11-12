-- The franchise now finishes registration on its own dashboard: a correct code
-- marks the pending registration verified, and the account is only created
-- once the candidate chooses a password on the franchise's screen.

alter table public.franchise_registrations
  add column verified_at timestamptz;
