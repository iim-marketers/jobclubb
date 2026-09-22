-- ₹1,199 franchise plan, only for candidates who signed up with a franchise code.
alter table public.candidates
  drop constraint candidates_membership_plan_check,
  add constraint candidates_membership_plan_check
    check (membership_plan in ('free', 'member', 'franchise')),
  add constraint candidates_franchise_plan_requires_code
    check (membership_plan is distinct from 'franchise' or code like 'JC-FR-%');
