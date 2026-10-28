import "server-only";

import { candidateLabel } from "@/lib/company-activity";
import {
  isFresher,
  qualifiesForReplacement,
  todayIst,
  type LeftReason,
  type Leaving,
  type OfferTerms,
  type PlacementStatus,
  type ReplacementStatus,
} from "@/lib/placements";
import { REFERRED_STAGE, STAGES } from "@/lib/candidate-activity";
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

// Company-facing reads never select candidate contact details: offers run
// through JobClubb, which is what its fees pay for.

const UUID = /^[0-9a-f-]{36}$/i;

// A reverse embed on a unique column may come back as an object or an array.
const one = <T,>(embed: T | T[] | null | undefined) =>
  (Array.isArray(embed) ? embed[0] : embed) ?? null;

type ReplacesEmbed = { id: string } | { id: string }[] | null;

const BASE_COLUMNS =
  "id, application_id, company_id, candidate_id, status, monthly_salary, joining_date, offer_deadline, offer_notes, selected_at, offer_received_at, released_at, accepted_at, closed_at, updated_at, left_on, left_reason, left_notes, resigned_on, replacement_status, replacement_note, replacement_closed_at, job_applications!placements_application_id_fkey (ref, job_id, job_title, company_name, candidate_no, candidate_id, shortlisted_at, city, replaces:placements!placements_replacement_application_id_fkey (id)), replacement:job_applications!placements_replacement_application_id_fkey (ref, candidate_no, candidate_id, shortlisted_at), category:candidates (emporium_batch_id)";

type ApplicationRef = {
  ref: string;
  candidate_no: number;
  candidate_id: string;
  shortlisted_at: string | null;
};

type BaseRow = {
  id: string;
  application_id: string;
  company_id: string;
  candidate_id: string;
  status: PlacementStatus;
  monthly_salary: number | null;
  joining_date: string | null;
  offer_deadline: string | null;
  offer_notes: string | null;
  selected_at: string;
  offer_received_at: string | null;
  released_at: string | null;
  accepted_at: string | null;
  closed_at: string | null;
  updated_at: string;
  left_on: string | null;
  left_reason: LeftReason | null;
  left_notes: string | null;
  resigned_on: string | null;
  replacement_status: ReplacementStatus | null;
  replacement_note: string | null;
  replacement_closed_at: string | null;
  job_applications: ApplicationRef & {
    job_id: string;
    job_title: string;
    company_name: string;
    city: string;
    replaces: ReplacesEmbed;
  };
  replacement: ApplicationRef | null;
  category: { emporium_batch_id: string | null };
};

const PRE_RELEASE: PlacementStatus[] = ["awaiting_offer", "offer_received"];
const COMPANY_WITHDRAWABLE: PlacementStatus[] = ["awaiting_offer", "offer_received", "released"];
const ADMIN_WITHDRAWABLE: PlacementStatus[] = [...COMPANY_WITHDRAWABLE, "accepted"];
// "released" and "expired" only exist from before offers stopped being paid for
// on JobClubb; the team can still send those candidates their offer letter.
const SENDABLE: PlacementStatus[] = [...PRE_RELEASE, "released", "expired"];
const DECLINABLE: PlacementStatus[] = ["offer_received", "released"];

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
  fresher: boolean;
  monthlySalary: number | null;
  joiningDate: string | null;
  offerDeadline: string | null;
  notes: string;
  selectedAt: string;
  releasedAt: string | null;
  acceptedAt: string | null;
  closedAt: string | null;
  left: Leaving | null;
  isReplacement: boolean;
  replacement: {
    status: ReplacementStatus;
    ref: string | null;
    candidate: string | null;
    note: string;
    closedAt: string | null;
  } | null;
};

async function rowNames(rows: BaseRow[]) {
  const names = await revealedNames(
    rows.flatMap((r) => (r.replacement ? [r.job_applications, r.replacement] : [r.job_applications])),
  );
  const nameOf = (a: ApplicationRef) => names.get(a.candidate_id) ?? candidateLabel(a.candidate_no);
  return { nameOf };
}

function toSummary(row: BaseRow, candidate: string, replacementName: string | null): PlacementSummary {
  return {
    id: row.id,
    ref: row.job_applications.ref,
    jobId: row.job_applications.job_id,
    designation: row.job_applications.job_title,
    companyName: row.job_applications.company_name,
    candidate,
    city: row.job_applications.city,
    status: row.status,
    fresher: isFresher(row.category),
    monthlySalary: row.monthly_salary,
    joiningDate: row.joining_date,
    offerDeadline: row.offer_deadline,
    notes: row.offer_notes ?? "",
    selectedAt: row.selected_at,
    releasedAt: row.released_at,
    acceptedAt: row.accepted_at,
    closedAt: row.closed_at,
    left:
      row.left_on && row.left_reason
        ? {
            leftOn: row.left_on,
            reason: row.left_reason,
            resignedOn: row.resigned_on,
            notes: row.left_notes ?? "",
          }
        : null,
    isReplacement: !!one(row.job_applications.replaces),
    replacement: row.replacement_status
      ? {
          status: row.replacement_status,
          ref: row.replacement?.ref ?? null,
          candidate: replacementName,
          note: row.replacement_note ?? "",
          closedAt: row.replacement_closed_at,
        }
      : null,
  };
}

export type CompanyPlacement = PlacementSummary & { documents: number };

async function companyPlacements(companyId: string, applicationRef?: string) {
  let query = createAdminClient()
    .from("placements")
    .select(`${BASE_COLUMNS}, placement_documents (count)`)
    .eq("company_id", companyId)
    .order("selected_at", { ascending: false });
  if (applicationRef) query = query.eq("job_applications.ref", applicationRef);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data as unknown as (BaseRow & { placement_documents: { count: number }[] })[])
    // Filtering on an embed without !inner nulls the embed instead of dropping the row.
    .filter((r) => r.job_applications);
  const { nameOf } = await rowNames(rows);
  return rows.map(
    (r): CompanyPlacement => ({
      ...toSummary(r, nameOf(r.job_applications), r.replacement && nameOf(r.replacement)),
      documents: r.placement_documents[0]?.count ?? 0,
    }),
  );
}

export const listCompanyPlacements = (companyId: string) => companyPlacements(companyId);

export async function getCompanyPlacementForApplication(companyId: string, applicationRef: string) {
  return (await companyPlacements(companyId, applicationRef))[0] ?? null;
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

export async function reportLeaving(id: string, leaving: Leaving, scope: Scope = {}) {
  if (!UUID.test(id)) return null;
  const admin = createAdminClient();
  let lookup = admin
    .from("placements")
    .select(
      "joining_date, job_applications!placements_application_id_fkey (replaces:placements!placements_replacement_application_id_fkey (id))",
    )
    .eq("id", id);
  if (scope.companyId) lookup = lookup.eq("company_id", scope.companyId);
  const { data: placement, error: lookupError } = await lookup.maybeSingle();
  if (lookupError) throw lookupError;
  if (!placement?.joining_date) return null;

  const isReplacement = !!one(
    (placement.job_applications as unknown as { replaces: ReplacesEmbed }).replaces,
  );
  const replacementOwed =
    !isReplacement &&
    leaving.resignedOn !== null &&
    qualifiesForReplacement(placement.joining_date, leaving.resignedOn);

  let query = admin
    .from("placements")
    .update({
      left_on: leaving.leftOn,
      left_reason: leaving.reason,
      left_notes: leaving.notes || null,
      left_reported_at: now(),
      resigned_on: leaving.resignedOn,
      replacement_status: replacementOwed ? "owed" : null,
      updated_at: now(),
    })
    .eq("id", id)
    .eq("status", "joined")
    .is("left_on", null)
    .eq("joining_date", placement.joining_date)
    .lte("joining_date", leaving.resignedOn ?? leaving.leftOn);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  const { data, error } = await query.select("id");
  if (error) throw error;
  return data.length > 0 ? { replacementOwed } : null;
}

export async function listReplacementCandidates(id: string) {
  if (!UUID.test(id)) return [];
  const admin = createAdminClient();
  const { data: placement, error } = await admin
    .from("placements")
    .select("company_id, application_id, job_applications!placements_application_id_fkey (job_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!placement) return [];
  const jobId = (placement.job_applications as unknown as { job_id: string }).job_id;

  const { data: rows, error: rowsError } = await admin
    .from("job_applications")
    .select(
      "ref, job_id, job_title, stage, shortlisted_at, candidates (first_name, last_name), placements!placements_application_id_fkey (id), replaces:placements!placements_replacement_application_id_fkey (id)",
    )
    .eq("company_id", placement.company_id)
    .gte("stage", REFERRED_STAGE)
    .eq("status", "active")
    .neq("id", placement.application_id)
    .order("shortlisted_at", { ascending: false });
  if (rowsError) throw rowsError;
  return (
    rows as unknown as {
      ref: string;
      job_id: string;
      job_title: string;
      stage: number;
      candidates: { first_name: string; last_name: string };
      placements: ReplacesEmbed;
      replaces: ReplacesEmbed;
    }[]
  )
    .filter((r) => !one(r.placements) && !one(r.replaces))
    .map((r) => ({
      ref: r.ref,
      name: `${r.candidates.first_name} ${r.candidates.last_name}`,
      jobTitle: r.job_title,
      stage: STAGES[r.stage],
      sameRole: r.job_id === jobId,
    }));
}

export async function linkReplacement(id: string, ref: string) {
  if (!UUID.test(id) || !/^JC-[0-9A-Z]{6}$/.test(ref)) return "This application no longer exists.";
  const admin = createAdminClient();
  const { data: placement, error } = await admin
    .from("placements")
    .select("company_id, application_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!placement) return false;
  const { data: application, error: applicationError } = await admin
    .from("job_applications")
    .select("id")
    .eq("ref", ref)
    .eq("company_id", placement.company_id)
    .gte("stage", REFERRED_STAGE)
    .neq("id", placement.application_id)
    .maybeSingle();
  if (applicationError) throw applicationError;
  if (!application) return "Choose a candidate JobClubb has referred to this company.";

  const at = now();
  const { data, error: updateError } = await admin
    .from("placements")
    .update({
      replacement_status: "fulfilled",
      replacement_application_id: application.id,
      replacement_closed_at: at,
      updated_at: at,
    })
    .eq("id", id)
    .eq("replacement_status", "owed")
    .select("id");
  if (updateError) {
    if (updateError.code === "23505") return "That candidate is already linked as a replacement.";
    throw updateError;
  }
  return data.length > 0;
}

export async function waiveReplacement(id: string, note: string) {
  if (!UUID.test(id)) return false;
  const at = now();
  const { data, error } = await createAdminClient()
    .from("placements")
    .update({
      replacement_status: "waived",
      replacement_note: note,
      replacement_closed_at: at,
      updated_at: at,
    })
    .eq("id", id)
    .eq("replacement_status", "owed")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function countReplacementsOwed() {
  const { count, error } = await createAdminClient()
    .from("placements")
    .select("id", { count: "exact", head: true })
    .eq("replacement_status", "owed");
  if (error) throw error;
  return count ?? 0;
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

function toAdmin(row: AdminRow, replacementName: string | null): AdminPlacement {
  const name = `${row.candidates.first_name} ${row.candidates.last_name}`;
  return {
    ...toSummary(row, name, replacementName),
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
  const rows = data as unknown as AdminRow[];
  const { nameOf } = await rowNames(rows);
  return rows.map((r) => toAdmin(r, r.replacement && nameOf(r.replacement)));
}

export async function getAdminPlacement(id: string): Promise<
  | (AdminPlacement & { documents: PlacementDocument[] })
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

  const row = data as unknown as AdminRow;
  const [documents, { nameOf }] = await Promise.all([
    listOfferDocuments(id, { signed: true }),
    rowNames([row]),
  ]);

  return {
    ...toAdmin(row, row.replacement && nameOf(row.replacement)),
    documents,
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
    .in("status", SENDABLE)
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

export type SendResult = { ok: true } | { ok: false; error: string };

// Sent once the team has confirmed the offer with the candidate and settled any
// fee outside JobClubb, so the candidate has accepted by the time it lands.
export async function sendOfferLetter(id: string): Promise<SendResult> {
  if (!UUID.test(id)) return { ok: false, error: "This placement no longer exists." };
  const admin = createAdminClient();
  const { data: p, error } = await admin
    .from("placements")
    .select("status, monthly_salary, joining_date, released_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!p) return { ok: false, error: "This placement no longer exists." };
  if (!SENDABLE.includes(p.status)) return { ok: false, error: "This offer letter has already been sent." };
  if (!p.monthly_salary || !p.joining_date)
    return { ok: false, error: "Add the monthly salary and joining date first." };
  if ((await countOfferDocuments(id)) === 0)
    return { ok: false, error: "Upload the offer letter first." };
  if (p.joining_date < todayIst())
    return { ok: false, error: "The joining date has passed. Update it before sending." };

  const at = now();
  const { data: updated, error: updateError } = await admin
    .from("placements")
    .update({
      status: "accepted",
      released_at: p.released_at ?? at,
      accepted_at: at,
      closed_at: null,
      updated_at: at,
    })
    .eq("id", id)
    .in("status", SENDABLE)
    .eq("updated_at", p.updated_at)
    .select("id");
  if (updateError) throw updateError;
  if (updated.length === 0)
    return { ok: false, error: "The offer changed while you were sending it. Refresh and check it again." };
  return { ok: true };
}

// The candidate turned the offer down when the team contacted them, so they
// already know they were selected.
export async function declinePlacement(id: string) {
  if (!UUID.test(id)) return false;
  const admin = createAdminClient();
  const { data: p, error } = await admin
    .from("placements")
    .select("status, released_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!p || !DECLINABLE.includes(p.status)) return false;
  const at = now();
  const { data, error: updateError } = await admin
    .from("placements")
    .update({
      status: "declined",
      released_at: p.released_at ?? at,
      closed_at: at,
      updated_at: at,
    })
    .eq("id", id)
    .eq("status", p.status)
    .select("id");
  if (updateError) throw updateError;
  return data.length > 0;
}

export async function storeAdminDocuments(id: string, files: File[]) {
  const existing = await countOfferDocuments(id);
  const fileError = offerFilesError(files, existing) ?? (files.length === 0 ? "Choose a file." : undefined);
  if (fileError) return fileError;
  await storeOfferDocuments(id, files, "admin");
}
