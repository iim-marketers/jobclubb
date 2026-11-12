import "server-only";

import {
  franchiseCodeFor,
  FRANCHISE_CODE_PREFIX,
  type Constitution,
  type FranchiseInput,
  type FranchiseProfileInput,
  type FranchiseTermsInput,
} from "@/lib/franchise";
import { locationPrefix } from "@/lib/emporium";
import { isMembershipActive } from "@/lib/membership";
import type { PlacementStatus } from "@/lib/placements";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Franchise = {
  id: string;
  status: ReviewStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  emailVerifiedAt: string | null;
  code: string | null;
  name: string;
  legalName: string;
  constitution: Constitution;
  pan: string;
  gstin: string | null;
  ownerName: string;
  email: string;
  phone: string;
  registeredAddress: string;
  outletAddress: string;
  city: string;
  pincode: string;
  areaSqft: number | null;
  territory: string | null;
  exclusive: boolean;
  franchiseFee: number | null;
  feePaidOn: string | null;
  feePaymentMode: string | null;
  feeTransactionId: string | null;
  startsOn: string | null;
  endsOn: string | null;
  terminatedOn: string | null;
  terminationNote: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIfsc: string | null;
  createdAt: string;
};

export type ApprovedFranchise = Franchise & {
  status: "approved";
  code: string;
  territory: string;
  startsOn: string;
  endsOn: string;
};

export const isApproved = <T extends Franchise>(f: T): f is T & ApprovedFranchise =>
  f.status === "approved" && !!f.code && !!f.territory && !!f.startsOn && !!f.endsOn;

export const FRANCHISE_COLUMNS =
  "id, status, review_note, reviewed_at, email_verified_at, code, name, legal_name, constitution, pan, gstin, owner_name, email, phone, registered_address, outlet_address, city, pincode, area_sqft, territory, exclusive, franchise_fee, fee_paid_on, fee_payment_mode, fee_transaction_id, starts_on, ends_on, terminated_on, termination_note, bank_account_name, bank_name, bank_account_no, bank_ifsc, created_at";

type FranchiseRow = {
  id: string;
  status: ReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  email_verified_at: string | null;
  code: string | null;
  name: string;
  legal_name: string;
  constitution: Constitution;
  pan: string;
  gstin: string | null;
  owner_name: string;
  email: string;
  phone: string;
  registered_address: string;
  outlet_address: string;
  city: string;
  pincode: string;
  area_sqft: number | null;
  territory: string | null;
  exclusive: boolean;
  franchise_fee: number | null;
  fee_paid_on: string | null;
  fee_payment_mode: string | null;
  fee_transaction_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
  terminated_on: string | null;
  termination_note: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  created_at: string;
};

export const toFranchise = (r: FranchiseRow): Franchise => ({
  id: r.id,
  status: r.status,
  reviewNote: r.review_note,
  reviewedAt: r.reviewed_at,
  emailVerifiedAt: r.email_verified_at,
  code: r.code,
  name: r.name,
  legalName: r.legal_name,
  constitution: r.constitution,
  pan: r.pan,
  gstin: r.gstin,
  ownerName: r.owner_name,
  email: r.email,
  phone: r.phone,
  registeredAddress: r.registered_address,
  outletAddress: r.outlet_address,
  city: r.city,
  pincode: r.pincode,
  areaSqft: r.area_sqft,
  territory: r.territory,
  exclusive: r.exclusive,
  franchiseFee: r.franchise_fee,
  feePaidOn: r.fee_paid_on,
  feePaymentMode: r.fee_payment_mode,
  feeTransactionId: r.fee_transaction_id,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  terminatedOn: r.terminated_on,
  terminationNote: r.termination_note,
  bankAccountName: r.bank_account_name,
  bankName: r.bank_name,
  bankAccountNo: r.bank_account_no,
  bankIfsc: r.bank_ifsc,
  createdAt: r.created_at,
});

export const profileColumns = (input: FranchiseProfileInput) => ({
  name: input.name,
  legal_name: input.legalName,
  constitution: input.constitution,
  pan: input.pan,
  gstin: input.gstin,
  owner_name: input.ownerName,
  phone: input.phone,
  registered_address: input.registeredAddress,
  outlet_address: input.outletAddress,
  city: input.city,
  pincode: input.pincode,
  area_sqft: input.areaSqft,
  bank_account_name: input.bankAccountName,
  bank_name: input.bankName,
  bank_account_no: input.bankAccountNo,
  bank_ifsc: input.bankIfsc,
});

const termsColumns = (input: FranchiseTermsInput) => ({
  territory: input.territory,
  exclusive: input.exclusive,
  franchise_fee: input.franchiseFee,
  fee_paid_on: input.feePaidOn,
  fee_payment_mode: input.feePaymentMode,
  fee_transaction_id: input.feeTransactionId,
  starts_on: input.startsOn,
  ends_on: input.endsOn,
});

export type FranchiseSummary = Franchise & {
  candidates: number;
  paidCandidates: number;
  outstanding: number;
};

export async function listFranchises(): Promise<FranchiseSummary[]> {
  const admin = createAdminClient();
  const [franchises, candidates, outstanding] = await Promise.all([
    admin.from("franchises").select(FRANCHISE_COLUMNS).order("created_at", { ascending: false }),
    admin
      .from("candidates")
      .select("franchise_id, membership_paid_at")
      .not("franchise_id", "is", null),
    admin
      .from("franchise_commissions")
      .select("franchise_id, amount")
      .is("payout_id", null)
      .is("reversed_at", null),
  ]);
  if (franchises.error) throw franchises.error;
  if (candidates.error) throw candidates.error;
  if (outstanding.error) throw outstanding.error;

  return (franchises.data as FranchiseRow[]).map((row) => {
    const own = candidates.data.filter((c) => c.franchise_id === row.id);
    return {
      ...toFranchise(row),
      candidates: own.length,
      paidCandidates: own.filter((c) => c.membership_paid_at).length,
      outstanding: outstanding.data
        .filter((c) => c.franchise_id === row.id)
        .reduce((sum, c) => sum + c.amount, 0),
    };
  });
}

export async function getFranchise(id: string): Promise<Franchise | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .select(FRANCHISE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toFranchise(data as FranchiseRow) : null;
}

async function nextCode(city: string) {
  const prefix = `${FRANCHISE_CODE_PREFIX}${locationPrefix(city)}`;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .select("code")
    .like("code", `${prefix}%`);
  if (error) throw error;
  const used = data
    .map((r) => Number(r.code.slice(prefix.length)))
    .filter((n) => Number.isInteger(n));
  return franchiseCodeFor(city, used.length ? Math.max(...used) + 1 : 1);
}

const CODE_ATTEMPTS = 3;

export async function createFranchise(
  input: FranchiseInput,
): Promise<{ ok: true; id: string; code: string } | { ok: false; errors: FieldErrors }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { role: "franchise", name: input.name, owner_name: input.ownerName },
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists")
      return { ok: false, errors: { email: "An account with this email already exists. Use a different email." } };
    if (error.code === "weak_password")
      return { ok: false, errors: { password: "Choose a stronger password." } };
    throw error;
  }

  const id = data.user.id;
  const now = new Date().toISOString();
  try {
    // Two franchises created in the same city at once can race for a code.
    for (let attempt = 1; ; attempt++) {
      const code = await nextCode(input.city);
      const { error: insertError } = await admin.from("franchises").insert({
        id,
        code,
        email: input.email,
        status: "approved",
        reviewed_at: now,
        email_verified_at: now,
        ...profileColumns(input),
        ...termsColumns(input),
      });
      if (!insertError) return { ok: true, id, code };
      if (insertError.code !== "23505" || attempt >= CODE_ATTEMPTS) throw insertError;
    }
  } catch (insertError) {
    await admin.auth.admin.deleteUser(id);
    throw insertError;
  }
}

// Approval happens once the agreement is signed; it sets the Schedule A terms and the code.
export async function approveFranchise(
  id: string,
  terms: FranchiseTermsInput & { name: string },
): Promise<"approved" | "missing" | "stale"> {
  const franchise = await getFranchise(id);
  if (!franchise) return "missing";
  if (franchise.status === "approved") return "stale";
  const admin = createAdminClient();
  for (let attempt = 1; ; attempt++) {
    const code = franchise.code ?? (await nextCode(franchise.city));
    const { data, error } = await admin
      .from("franchises")
      .update({
        status: "approved",
        code,
        name: terms.name,
        review_note: null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...termsColumns(terms),
      })
      .eq("id", id)
      .neq("status", "approved")
      .select("id");
    if (!error) return data.length > 0 ? "approved" : "stale";
    if (error.code !== "23505" || attempt >= CODE_ATTEMPTS) throw error;
  }
}

export async function rejectFranchise(id: string, note: string): Promise<"rejected" | "stale"> {
  if (!UUID.test(id)) return "stale";
  const { data, error } = await createAdminClient()
    .from("franchises")
    .update({
      status: "rejected",
      review_note: note,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  return data.length > 0 ? "rejected" : "stale";
}

export async function updateFranchise(
  id: string,
  profile: FranchiseProfileInput,
  terms: FranchiseTermsInput | null,
) {
  if (!UUID.test(id)) return false;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .update({
      ...profileColumns(profile),
      ...(terms ? termsColumns(terms) : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return false;

  const { error: metaError } = await createAdminClient().auth.admin.updateUserById(id, {
    user_metadata: { role: "franchise", name: profile.name, owner_name: profile.ownerName },
  });
  if (metaError) console.error("Updating franchise login name failed", metaError);
  return true;
}

export async function terminateFranchise(id: string, terminatedOn: string, note: string) {
  if (!UUID.test(id)) return false;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .update({ terminated_on: terminatedOn, termination_note: note, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function extendFranchise(id: string, endsOn: string) {
  if (!UUID.test(id)) return false;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .update({
      ends_on: endsOn,
      terminated_on: null,
      termination_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export type FranchiseCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  membershipPaidAt: string | null;
  membershipActive: boolean;
  applications: number;
  placement: PlacementStatus | null;
  createdAt: string;
};

const PLACEMENT_RANK: PlacementStatus[] = [
  "joined",
  "accepted",
  "released",
  "offer_received",
  "awaiting_offer",
  "not_joined",
  "declined",
  "expired",
  "withdrawn",
];

// Franchises only see candidates whose registration finished with a payment;
// admin also sees abandoned, unpaid ones.
export async function listFranchiseCandidates(
  franchiseId: string,
  { paidOnly = false }: { paidOnly?: boolean } = {},
): Promise<FranchiseCandidate[]> {
  let query = createAdminClient()
    .from("candidates")
    .select(
      "id, first_name, last_name, email, phone, city, industry, membership_paid_at, membership_expires_at, created_at, job_applications!job_applications_candidate_id_fkey (count), placements!placements_candidate_id_fkey (status)",
    )
    .eq("franchise_id", franchiseId);
  if (paidOnly) query = query.not("membership_paid_at", "is", null);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  return data.map((c) => {
    const statuses = (c.placements as { status: PlacementStatus }[]).map((p) => p.status);
    return {
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      city: c.city,
      industry: c.industry,
      membershipPaidAt: c.membership_paid_at,
      membershipActive: isMembershipActive(c.membership_expires_at),
      applications: (c.job_applications as { count: number }[])[0]?.count ?? 0,
      placement: PLACEMENT_RANK.find((s) => statuses.includes(s)) ?? null,
      createdAt: c.created_at,
    };
  });
}

export async function countPendingFranchises() {
  const { count, error } = await createAdminClient()
    .from("franchises")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) {
    console.error("Counting franchise applications failed", error);
    return 0;
  }
  return count ?? 0;
}

// Only fills empty bank details: once set, only admin can change them.
export async function addOwnBankDetails(
  id: string,
  bank: { bankAccountName: string; bankName: string; bankAccountNo: string; bankIfsc: string },
) {
  const { data, error } = await createAdminClient()
    .from("franchises")
    .update({
      bank_account_name: bank.bankAccountName,
      bank_name: bank.bankName,
      bank_account_no: bank.bankAccountNo,
      bank_ifsc: bank.bankIfsc,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("bank_account_no", null)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
