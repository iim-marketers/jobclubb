import "server-only";

import { candidateLabel } from "@/lib/company-activity";
import {
  isPastDeadline,
  releaseDeadline,
  todayIst,
  type OfferTerms,
  type PlacementStatus,
} from "@/lib/placements";
import { createAdminClient } from "@/lib/supabase/server";
import { revealedNames } from "@/server/applications/company";
import {
  countOfferDocuments,
  listOfferDocuments,
  offerFilesError,
  removeOfferDocuments,
  storeOfferDocuments,
  type PlacementDocument,
} from "@/server/placements/documents";

// Company-facing reads never select candidate contact details: selection runs
// through JobClubb, which is what the placement fee pays for.

const UUID = /^[0-9a-f-]{36}$/i;

const BASE_COLUMNS =
  "id, application_id, company_id, candidate_id, status, monthly_salary, fee_amount, joining_date, offer_deadline, offer_notes, selected_at, offer_received_at, released_at, accepted_at, closed_at, updated_at, job_applications (ref, job_id, job_title, company_name, candidate_no, candidate_id, shortlisted_at, city)";

type BaseRow = {
  id: string;
  application_id: string;
  company_id: string;
  candidate_id: string;
  status: PlacementStatus;
  monthly_salary: number | null;
  fee_amount: number | null;
  joining_date: string | null;
  offer_deadline: string | null;
  offer_notes: string | null;
  selected_at: string;
  offer_received_at: string | null;
  released_at: string | null;
  accepted_at: string | null;
  closed_at: string | null;
  updated_at: string;
  job_applications: {
    ref: string;
    job_id: string;
    job_title: string;
    company_name: string;
    candidate_no: number;
    candidate_id: string;
    shortlisted_at: string | null;
    city: string;
  };
};

const PRE_RELEASE: PlacementStatus[] = ["awaiting_offer", "offer_received"];
const COMPANY_WITHDRAWABLE: PlacementStatus[] = ["awaiting_offer", "offer_received", "released"];
const ADMIN_WITHDRAWABLE: PlacementStatus[] = [...COMPANY_WITHDRAWABLE, "accepted"];

// The expiry job runs hourly; reads treat a passed deadline as expired straight away.
export function effectiveStatus(row: { status: PlacementStatus; offer_deadline: string | null }) {
  return row.status === "released" && row.offer_deadline && isPastDeadline(row.offer_deadline)
    ? "expired"
    : row.status;
}

const now = () => new Date().toISOString();

export type PlacementSummary = {
  id: string;
  ref: string;
  jobId: string;
  designation: string;
  companyName: string;
  candidate: string;
  city: string;
  status: PlacementStatus;
  monthlySalary: number | null;
  fee: number | null;
  joiningDate: string | null;
  offerDeadline: string | null;
  notes: string;
  selectedAt: string;
  releasedAt: string | null;
  acceptedAt: string | null;
  closedAt: string | null;
};

function toSummary(row: BaseRow, candidate: string): PlacementSummary {
  return {
    id: row.id,
    ref: row.job_applications.ref,
    jobId: row.job_applications.job_id,
    designation: row.job_applications.job_title,
    companyName: row.job_applications.company_name,
    candidate,
    city: row.job_applications.city,
    status: effectiveStatus(row),
    monthlySalary: row.monthly_salary,
    fee: row.fee_amount,
    joiningDate: row.joining_date,
    offerDeadline: row.offer_deadline,
    notes: row.offer_notes ?? "",
    selectedAt: row.selected_at,
    releasedAt: row.released_at,
    acceptedAt: row.accepted_at,
    closedAt: row.closed_at,
  };
}

export type CompanyPlacement = PlacementSummary & { documents: number };

export async function listCompanyPlacements(companyId: string): Promise<CompanyPlacement[]> {
  const { data, error } = await createAdminClient()
    .from("placements")
    .select(`${BASE_COLUMNS}, placement_documents (count)`)
    .eq("company_id", companyId)
    .order("selected_at", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as (BaseRow & { placement_documents: { count: number }[] })[];
  const names = await revealedNames(rows.map((r) => r.job_applications));
  return rows.map((r) => ({
    ...toSummary(
      r,
      names.get(r.job_applications.candidate_id) ?? candidateLabel(r.job_applications.candidate_no),
    ),
    documents: r.placement_documents[0]?.count ?? 0,
  }));
}

export async function getCompanyPlacementForApplication(companyId: string, applicationRef: string) {
  const { data, error } = await createAdminClient()
    .from("placements")
    .select("id, status, offer_deadline, job_applications!inner (ref)")
    .eq("company_id", companyId)
    .eq("job_applications.ref", applicationRef)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id as string, status: effectiveStatus(data) } : null;
}

export type OfferResult =
  | { ok: true; firstSubmission: boolean }
  | { ok: false; error: string; field?: "documents" };

export async function submitCompanyOffer(
  companyId: string,
  id: string,
  terms: OfferTerms,
  files: File[],
): Promise<OfferResult> {
  if (!UUID.test(id)) return { ok: false, error: "This placement no longer exists." };
  const admin = createAdminClient();
  const { data: placement, error } = await admin
    .from("placements")
    .select("status, offer_received_at")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  if (!placement) return { ok: false, error: "This placement no longer exists." };
  if (!PRE_RELEASE.includes(placement.status))
    return { ok: false, error: "JobClubb has already shared this offer, so it can't be changed here." };

  const existing = await countOfferDocuments(id);
  const fileError =
    offerFilesError(files, existing) ??
    (existing + files.length === 0 ? "Attach the offer letter." : undefined);
  if (fileError) return { ok: false, error: fileError, field: "documents" };

  const stored = await storeOfferDocuments(id, files, "company");
  const at = now();
  const { data: updated, error: updateError } = await admin
    .from("placements")
    .update({
      status: "offer_received",
      monthly_salary: terms.monthlySalary,
      joining_date: terms.joiningDate,
      offer_deadline: terms.offerDeadline,
      offer_notes: terms.notes || null,
      offer_received_at: placement.offer_received_at ?? at,
      updated_at: at,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .in("status", PRE_RELEASE)
    .select("id");
  if (updateError || updated.length === 0) {
    // Released while uploading: don't leave unreviewed files on a shared offer.
    await removeOfferDocuments(stored);
    if (updateError) throw updateError;
    return { ok: false, error: "JobClubb has already shared this offer, so it can't be changed here." };
  }
  return { ok: true, firstSubmission: !placement.offer_received_at };
}

type Scope = { companyId?: string };

export async function withdrawPlacement(id: string, scope: Scope = {}) {
  if (!UUID.test(id)) return null;
  let query = createAdminClient()
    .from("placements")
    .update({ status: "withdrawn", closed_at: now(), updated_at: now() })
    .eq("id", id)
    .in("status", scope.companyId ? COMPANY_WITHDRAWABLE : ADMIN_WITHDRAWABLE);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  const { data, error } = await query.select("released_at");
  if (error) throw error;
  return data[0] ? { candidateWasTold: data[0].released_at !== null } : null;
}

export async function recordJoining(id: string, joined: boolean, scope: Scope = {}) {
  if (!UUID.test(id)) return false;
  let query = createAdminClient()
    .from("placements")
    .update({ status: joined ? "joined" : "not_joined", closed_at: now(), updated_at: now() })
    .eq("id", id)
    .eq("status", "accepted")
    .lte("joining_date", todayIst());
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  const { data, error } = await query.select("id");
  if (error) throw error;
  return data.length > 0;
}

export type AdminPlacement = PlacementSummary & {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateCity: string;
  propertyName: string | null;
  companyContact: { name: string; designation: string; email: string; phone: string };
  offerReceivedAt: string | null;
};

const ADMIN_COLUMNS = `${BASE_COLUMNS}, candidates (first_name, last_name, email, phone, city), companies (property_name, contact_name, designation, email, phone)`;

type AdminRow = BaseRow & {
  candidates: { first_name: string; last_name: string; email: string; phone: string; city: string };
  companies: {
    property_name: string | null;
    contact_name: string;
    designation: string;
    email: string;
    phone: string;
  };
};

function toAdmin(row: AdminRow): AdminPlacement {
  const name = `${row.candidates.first_name} ${row.candidates.last_name}`;
  return {
    ...toSummary(row, name),
    candidateName: name,
    candidateEmail: row.candidates.email,
    candidatePhone: row.candidates.phone,
    candidateCity: row.candidates.city,
    propertyName: row.companies.property_name,
    companyContact: {
      name: row.companies.contact_name,
      designation: row.companies.designation,
      email: row.companies.email,
      phone: row.companies.phone,
    },
    offerReceivedAt: row.offer_received_at,
  };
}

export async function listAdminPlacements(): Promise<AdminPlacement[]> {
  const { data, error } = await createAdminClient()
    .from("placements")
    .select(ADMIN_COLUMNS)
    .order("selected_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as AdminRow[]).map(toAdmin);
}

export type PlacementPayment = {
  orderId: string;
  status: "created" | "paid";
  amount: number;
  paymentId: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function getAdminPlacement(id: string): Promise<
  | (AdminPlacement & { documents: PlacementDocument[]; payments: PlacementPayment[] })
  | null
> {
  if (!UUID.test(id)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("placements")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [documents, { data: payments, error: paymentsError }] = await Promise.all([
    listOfferDocuments(id, { signed: true }),
    admin
      .from("placement_payments")
      .select("order_id, status, amount, payment_id, invoice_number, created_at, paid_at")
      .eq("placement_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (paymentsError) throw paymentsError;

  return {
    ...toAdmin(data as unknown as AdminRow),
    documents,
    payments: payments.map((p) => ({
      orderId: p.order_id,
      status: p.status,
      amount: p.amount,
      paymentId: p.payment_id,
      invoiceNumber: p.invoice_number,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })),
  };
}

export async function updatePlacementTerms(id: string, terms: OfferTerms) {
  if (!UUID.test(id)) return false;
  const { data, error } = await createAdminClient()
    .from("placements")
    .update({
      monthly_salary: terms.monthlySalary,
      joining_date: terms.joiningDate,
      offer_deadline: terms.offerDeadline,
      offer_notes: terms.notes || null,
      updated_at: now(),
    })
    .eq("id", id)
    .in("status", PRE_RELEASE)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function markOfferReceived(id: string) {
  const at = now();
  const { error } = await createAdminClient()
    .from("placements")
    .update({ status: "offer_received", offer_received_at: at, updated_at: at })
    .eq("id", id)
    .eq("status", "awaiting_offer");
  if (error) throw error;
}

export type ReleaseResult = { ok: true } | { ok: false; error: string };

export async function releasePlacement(id: string): Promise<ReleaseResult> {
  if (!UUID.test(id)) return { ok: false, error: "This placement no longer exists." };
  const admin = createAdminClient();
  const { data: p, error } = await admin
    .from("placements")
    .select("status, monthly_salary, joining_date, offer_deadline, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!p) return { ok: false, error: "This placement no longer exists." };
  if (!PRE_RELEASE.includes(p.status)) return { ok: false, error: "This offer has already been released." };
  if (!p.monthly_salary || !p.joining_date)
    return { ok: false, error: "Add the monthly salary and joining date first." };
  if ((await countOfferDocuments(id)) === 0)
    return { ok: false, error: "Upload the offer letter first." };

  const today = todayIst();
  if (p.joining_date < today)
    return { ok: false, error: "The joining date has passed. Update it before releasing." };
  const deadline = releaseDeadline({ joiningDate: p.joining_date, offerDeadline: p.offer_deadline });
  if (deadline < today)
    return { ok: false, error: "The offer deadline has passed. Update it before releasing." };

  const at = now();
  const { data: updated, error: updateError } = await admin
    .from("placements")
    .update({
      status: "released",
      released_at: at,
      fee_amount: p.monthly_salary,
      offer_deadline: deadline,
      updated_at: at,
    })
    .eq("id", id)
    .in("status", PRE_RELEASE)
    .eq("updated_at", p.updated_at)
    .select("id");
  if (updateError) throw updateError;
  if (updated.length === 0)
    return { ok: false, error: "The offer changed while you were releasing it. Refresh and check it again." };
  return { ok: true };
}

export async function extendPlacementDeadline(
  id: string,
  { offerDeadline, joiningDate }: { offerDeadline: string; joiningDate: string },
): Promise<ReleaseResult> {
  if (!UUID.test(id)) return { ok: false, error: "This placement no longer exists." };
  const today = todayIst();
  if (offerDeadline < today) return { ok: false, error: "Choose a deadline from today onwards." };
  if (joiningDate < offerDeadline)
    return { ok: false, error: "The joining date can't be before the deadline." };

  const { data, error } = await createAdminClient()
    .from("placements")
    .update({
      status: "released",
      offer_deadline: offerDeadline,
      joining_date: joiningDate,
      closed_at: null,
      updated_at: now(),
    })
    .eq("id", id)
    .in("status", ["released", "expired"])
    .select("id");
  if (error) throw error;
  return data.length > 0
    ? { ok: true }
    : { ok: false, error: "Only offers waiting for payment or expired can be extended." };
}

export async function declinePlacement(id: string, scope: { candidateId?: string } = {}) {
  if (!UUID.test(id)) return false;
  let query = createAdminClient()
    .from("placements")
    .update({ status: "declined", closed_at: now(), updated_at: now() })
    .eq("id", id)
    .eq("status", "released");
  if (scope.candidateId)
    query = query.eq("candidate_id", scope.candidateId).gte("offer_deadline", todayIst());
  const { data, error } = await query.select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function storeAdminDocuments(id: string, files: File[]) {
  const existing = await countOfferDocuments(id);
  const fileError = offerFilesError(files, existing) ?? (files.length === 0 ? "Choose a file." : undefined);
  if (fileError) return fileError;
  await storeOfferDocuments(id, files, "admin");
}
