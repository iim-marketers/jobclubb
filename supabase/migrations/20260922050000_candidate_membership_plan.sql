-- Null until the candidate picks a plan on their first sign-in.
-- 'member' records the choice only; payment status will get its own column.
alter table public.candidates
  add column membership_plan text check (membership_plan in ('free', 'member'));

grant update (membership_plan) on public.candidates to authenticated;
