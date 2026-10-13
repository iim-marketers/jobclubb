import "server-only";

import { splitGst, stateFromPincode, type GstSplit } from "@/lib/gst";
import {
  MEMBERSHIP_DAYS,
  PLAN_DETAILS,
  isMembershipPlan,
} from "@/lib/membership";
import { createAdminClient } from "@/lib/supabase/server";

export type MembershipInvoice = GstSplit & {
  invoiceNumber: string;
  issuedAt: string;
  paymentId: string;
  planName: string;
  validFrom: string;
  validUntil: string;
  amount: number;
  currency: string;
  placeOfSupply: string;
  billedTo: { name: string; email: string; city: string; pincode: string };
};

type InvoiceRow = {
  invoice_number: string | null;
  payment_id: string | null;
  plan: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  billing_name: string | null;
  billing_city: string | null;
  billing_pincode: string | null;
  place_of_supply: string | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  candidates: {
    first_name: string;
    last_name: string;
    email: string;
    city: string;
    pincode: string;
  };
};

const COLUMNS =
  "invoice_number, payment_id, plan, amount, currency, paid_at, billing_name, billing_city, billing_pincode, place_of_supply, taxable_amount, cgst_amount, sgst_amount, igst_amount, candidates (first_name, last_name, email, city, pincode)";

export function billingFor(candidate: {
  first_name: string;
  last_name: string;
  city: string;
  pincode: string;
}) {
  const placeOfSupply = stateFromPincode(candidate.pincode);
  return {
    billing_name: `${candidate.first_name} ${candidate.last_name}`,
    billing_city: candidate.city,
    billing_pincode: candidate.pincode,
    place_of_supply: placeOfSupply,
  };
}

export function gstColumns(amount: number, placeOfSupply: string) {
  const gst = splitGst(amount, placeOfSupply);
  return {
    taxable_amount: gst.taxable,
    cgst_amount: gst.cgst,
    sgst_amount: gst.sgst,
    igst_amount: gst.igst,
  };
}

export async function getMembershipInvoice(
  candidateId: string,
  paymentId: string,
): Promise<MembershipInvoice | null> {
  const { data, error } = await createAdminClient()
    .from("membership_payments")
    .select(COLUMNS)
    .eq("candidate_id", candidateId)
    .eq("payment_id", paymentId)
    .eq("status", "paid")
    .maybeSingle();
  if (error) throw error;

  const row = data as unknown as InvoiceRow | null;
  if (!row?.invoice_number || !row.payment_id || !row.paid_at || !isMembershipPlan(row.plan))
    return null;

  const fallback = billingFor(row.candidates);
  const placeOfSupply = row.place_of_supply ?? fallback.place_of_supply;
  const gst: GstSplit =
    row.taxable_amount !== null
      ? {
          taxable: row.taxable_amount,
          cgst: row.cgst_amount ?? 0,
          sgst: row.sgst_amount ?? 0,
          igst: row.igst_amount ?? 0,
        }
      : splitGst(row.amount, placeOfSupply);

  const validUntil = new Date(row.paid_at);
  validUntil.setDate(validUntil.getDate() + MEMBERSHIP_DAYS);

  return {
    ...gst,
    invoiceNumber: row.invoice_number,
    issuedAt: row.paid_at,
    paymentId: row.payment_id,
    planName: PLAN_DETAILS[row.plan].name,
    validFrom: row.paid_at,
    validUntil: validUntil.toISOString(),
    amount: row.amount,
    currency: row.currency,
    placeOfSupply,
    billedTo: {
      name: row.billing_name ?? fallback.billing_name,
      email: row.candidates.email,
      city: row.billing_city ?? fallback.billing_city,
      pincode: row.billing_pincode ?? fallback.billing_pincode,
    },
  };
}

export const invoiceFilename = (invoice: MembershipInvoice) =>
  `JobClubb-Invoice-${invoice.invoiceNumber.replaceAll("/", "-")}.pdf`;
