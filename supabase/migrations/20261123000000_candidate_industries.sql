alter table public.candidates
  add column industries text[] not null default '{}';

update public.candidates
set industries = array[industry]
where industry is not null;

alter table public.candidates drop column industry;

alter table public.candidates
  add constraint candidates_industries_not_empty check (cardinality(industries) >= 1);

-- Keep in sync with INDUSTRIES in src/lib/taxonomy.ts.
alter table public.candidates
  add constraint candidates_industries_check check (
    industries <@ array[
      'airlines', 'airport', 'hotels', 'restaurants', 'cafes',
      'bars-nightclubs', 'cruise-lines', 'travel-tourism'
    ]::text[]
  ) not valid;

grant update (industries) on public.candidates to authenticated;

-- Sign-ups started before the app deploy still send a single `industry`.
create or replace function public.handle_new_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  v_code text := nullif(upper(meta ->> 'code'), '');
  v_batch public.emporium_batches;
  v_used integer;
  v_industries text[];
begin
  if meta ->> 'role' is distinct from 'candidate' then
    return new;
  end if;

  if v_code like 'JC-FR-%' then
    raise exception 'franchise_code_not_allowed' using errcode = 'P0001';
  end if;

  if v_code like 'JC-EM-%' then
    select * into v_batch from public.emporium_batches where code = v_code for update;
    if not found then
      raise exception 'emporium_code_invalid' using errcode = 'P0001';
    end if;
    if not v_batch.active then
      raise exception 'emporium_code_paused' using errcode = 'P0001';
    end if;
    select count(*) into v_used from public.candidates where emporium_batch_id = v_batch.id;
    if v_used >= v_batch.seats then
      raise exception 'emporium_code_full' using errcode = 'P0001';
    end if;
  end if;

  if jsonb_typeof(meta -> 'industries') = 'array' then
    select array_agg(distinct value) into v_industries
    from jsonb_array_elements_text(meta -> 'industries');
  end if;
  v_industries := coalesce(
    v_industries,
    array_remove(array[coalesce(meta ->> 'industry', meta ->> 'vertical')], null)
  );

  insert into public.candidates (
    id, first_name, last_name, email, phone, city, pincode, industries,
    source, code, terms_version, email_verified_at,
    emporium_batch_id, membership_plan, membership_expires_at
  ) values (
    new.id,
    meta ->> 'first_name',
    meta ->> 'last_name',
    new.email,
    meta ->> 'phone',
    meta ->> 'city',
    meta ->> 'pincode',
    v_industries,
    meta ->> 'source',
    v_code,
    meta ->> 'terms_version',
    new.email_confirmed_at,
    v_batch.id,
    case when v_batch.id is not null then 'emporium' end,
    case when v_batch.id is not null then now() + interval '365 days' end
  );
  return new;
end;
$$;
