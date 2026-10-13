alter table public.job_interviews
  alter column place drop not null,
  add column address text check (length(address) between 1 and 200),
  add column landmark text check (length(landmark) between 1 and 100),
  add column city text check (length(city) between 1 and 80),
  add column pincode text check (pincode ~ '^\d{6}$'),
  add constraint job_interviews_place check (
    case when mode = 'in_person'
      then place is null and address is not null and city is not null and pincode is not null
      else place is not null and address is null and landmark is null and city is null and pincode is null
    end
  );
