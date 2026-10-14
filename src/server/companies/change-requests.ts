import "server-only";

import type { ChangeField } from "@/lib/company-change-requests";
import { createAdminClient } from "@/lib/supabase/server";

export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ChangeRequest = {
  id: string;
  companyId: string;
  field: ChangeField;
  oldValue: string | null;
  newValue: string;
  reason: string;
  status: ChangeRequestStatus;
  adminNote: string | null;
  createdAt: string;
};

const COLUMNS = "id, company_id, field, old_value, new_value, reason, status, admin_note, created_at";

type Row = {
  id: string;
  company_id: string;
  field: ChangeField;
  old_value: string | null;
  new_value: string;
  reason: string;
  status: ChangeRequestStatus;
  admin_note: string | null;
  created_at: string;
};

const toRequest = (r: Row): ChangeRequest => ({
  id: r.id,
  companyId: r.company_id,
  field: r.field,
  oldValue: r.old_value,
  newValue: r.new_value,
  reason: r.reason,
  status: r.status,
  adminNote: r.admin_note,
  createdAt: r.created_at,
});

export async function listPendingChanges(companyId?: string): Promise<ChangeRequest[]> {
  let query = createAdminClient()
    .from("company_change_requests")
    .select(COLUMNS)
    .eq("status", "pending")
    .order("created_at");
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(toRequest);
}

export async function countPendingChanges() {
  const { count, error } = await createAdminClient()
    .from("company_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

// Returns null when this field already has a pending request.
export async function createChangeRequest(request: {
  companyId: string;
  companyName: string;
  field: ChangeField;
  oldValue: string | null;
  newValue: string;
  reason: string;
}): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("company_change_requests")
    .insert({
      company_id: request.companyId,
      company_name: request.companyName,
      field: request.field,
      old_value: request.oldValue,
      new_value: request.newValue,
      reason: request.reason,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return null;
  if (error) throw error;
  return data.id;
}

export async function cancelChangeRequest(companyId: string, id: string) {
  const { data, error } = await createAdminClient()
    .from("company_change_requests")
    .update({ status: "cancelled", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function approveChangeRequest(id: string) {
  const { data, error } = await createAdminClient().rpc("approve_company_change", { p_id: id });
  if (error) throw error;
  return (data as Row[]).length > 0;
}

export async function rejectChangeRequest(id: string, note: string) {
  const { data, error } = await createAdminClient()
    .from("company_change_requests")
    .update({ status: "rejected", admin_note: note, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
