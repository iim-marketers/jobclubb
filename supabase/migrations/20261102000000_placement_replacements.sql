alter table public.placements
  add column resigned_on date,
  add column replacement_status text check (replacement_status in ('owed', 'fulfilled', 'waived')),
  add column replacement_application_id uuid unique references public.job_applications (id) on delete set null,
  add column replacement_note text check (length(replacement_note) <= 1000),
  add column replacement_closed_at timestamptz;

update public.placements set resigned_on = left_on where left_reason = 'resigned';

alter table public.placements
  add constraint placements_resigned check (
    (resigned_on is not null) = coalesce(left_reason = 'resigned', false)
    and (resigned_on is null or (resigned_on >= joining_date and resigned_on <= left_on))
  ),
  add constraint placements_replacement check (
    (replacement_status is null or left_reason = 'resigned')
    and (replacement_application_id is null or replacement_status = 'fulfilled')
    and (replacement_closed_at is not null) = coalesce(replacement_status in ('fulfilled', 'waived'), false)
    and (replacement_status is distinct from 'waived' or replacement_note is not null)
  );

create index placements_replacement_owed_idx on public.placements (company_id)
  where replacement_status = 'owed';
