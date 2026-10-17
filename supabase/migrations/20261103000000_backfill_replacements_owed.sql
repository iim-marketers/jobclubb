update public.placements p
set replacement_status = 'owed', updated_at = now()
where p.left_reason = 'resigned'
  and p.replacement_status is null
  and p.resigned_on < (p.joining_date + interval '3 months')::date
  and not exists (
    select 1 from public.placements r where r.replacement_application_id = p.application_id
  );
