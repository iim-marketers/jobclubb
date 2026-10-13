-- Null for orders created before this migration; those are worked out when rendered.
alter table public.membership_payments
  add column billing_name text check (length(billing_name) between 1 and 161),
  add column billing_city text check (length(billing_city) between 1 and 80),
  add column billing_pincode text check (billing_pincode ~ '^\d{6}$'),
  add column place_of_supply text check (place_of_supply ~ '^\d{2}$'),
  add column taxable_amount integer check (taxable_amount > 0),
  add column cgst_amount integer check (cgst_amount >= 0),
  add column sgst_amount integer check (sgst_amount >= 0),
  add column igst_amount integer check (igst_amount >= 0),
  add constraint membership_payments_gst_complete check (
    (taxable_amount is null) = (place_of_supply is null)
    and (taxable_amount is null) = (cgst_amount is null)
    and (taxable_amount is null) = (sgst_amount is null)
    and (taxable_amount is null) = (igst_amount is null)
  ),
  add constraint membership_payments_gst_total check (
    taxable_amount is null
    or taxable_amount + cgst_amount + sgst_amount + igst_amount = amount
  );
