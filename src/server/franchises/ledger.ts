import "server-only";

import {
  commissionState,
  monthKey,
  payoutDueOn,
  type CommissionKind,
  type CommissionState,
} from "@/lib/franchise";
import { createAdminClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export type Commission = {
  id: string;
  candidateId: string | null;
  candidateName: string;
  kind: CommissionKind;
  baseAmount: number;
  amount: number;
  earnedAt: string;
  dueOn: string;
  state: CommissionState;
  payoutId: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
};

export type Payout = {
  id: string;
  amount: number;
  paidOn: string;
  reference: string;
  note: string | null;
  createdAt: string;
};

export type Ledger = {
  commissions: Commission[];
  payouts: Payout[];
  totals: { earned: number; paid: number; outstanding: number };
};

type CommissionRow = {
  id: string;
  candidate_id: string | null;
  candidate_name: string;
  kind: CommissionKind;
  base_amount: number;
  amount: number;
  earned_at: string;
  payout_id: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
};

const toCommission = (r: CommissionRow): Commission => ({
  id: r.id,
  candidateId: r.candidate_id,
  candidateName: r.candidate_name,
  kind: r.kind,
  baseAmount: r.base_amount,
  amount: r.amount,
  earnedAt: r.earned_at,
  dueOn: payoutDueOn(r.earned_at),
  state: commissionState({ payoutId: r.payout_id, reversedAt: r.reversed_at }),
  payoutId: r.payout_id,
  reversedAt: r.reversed_at,
  reversalReason: r.reversal_reason,
});

export async function getLedger(franchiseId: string): Promise<Ledger> {
  const admin = createAdminClient();
  const [commissions, payouts] = await Promise.all([
    admin
      .from("franchise_commissions")
      .select(
        "id, candidate_id, candidate_name, kind, base_amount, amount, earned_at, payout_id, reversed_at, reversal_reason",
      )
      .eq("franchise_id", franchiseId)
      .order("earned_at", { ascending: false }),
    admin
      .from("franchise_payouts")
      .select("id, amount, paid_on, reference, note, created_at")
      .eq("franchise_id", franchiseId)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (commissions.error) throw commissions.error;
  if (payouts.error) throw payouts.error;

  const rows = (commissions.data as CommissionRow[]).map(toCommission);
  const outstanding = rows
    .filter((c) => !c.payoutId && !c.reversedAt)
    .reduce((sum, c) => sum + c.amount, 0);
  const paid = payouts.data.reduce((sum, p) => sum + p.amount, 0);

  return {
    commissions: rows,
    payouts: payouts.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      paidOn: p.paid_on,
      reference: p.reference,
      note: p.note,
      createdAt: p.created_at,
    })),
    totals: {
      // A reversed commission still counts here: its reversal row nets it off.
      earned: rows.filter((c) => c.state !== "cancelled").reduce((sum, c) => sum + c.amount, 0),
      paid,
      outstanding,
    },
  };
}

export async function countOutstandingPayouts() {
  const { data, error } = await createAdminClient()
    .from("franchise_commissions")
    .select("franchise_id")
    .is("payout_id", null)
    .is("reversed_at", null);
  if (error) {
    console.error("Counting franchise payouts failed", error);
    return 0;
  }
  return new Set(data.map((r) => r.franchise_id)).size;
}

export type FeeOutcome = "commission" | "no_commission" | "missing" | "no_fee" | "paid_out";

export async function recordCandidateFee(
  placementId: string,
  values: { amount: number; receivedOn: string; reference: string },
): Promise<FeeOutcome> {
  if (!UUID.test(placementId)) return "missing";
  const { data, error } = await createAdminClient().rpc("record_candidate_fee", {
    p_placement_id: placementId,
    p_amount: values.amount,
    p_received_on: values.receivedOn,
    p_reference: values.reference,
  });
  if (error) throw error;
  return data as FeeOutcome;
}

export async function reverseCommission(id: string, reason: string) {
  if (!UUID.test(id)) return "missing";
  const { data, error } = await createAdminClient().rpc("reverse_franchise_commission", {
    p_id: id,
    p_reason: reason,
  });
  if (error) throw error;
  return data as "cancelled" | "reversed" | "missing" | "already";
}

export type PayoutResult =
  | { ok: true; payout: Payout }
  | { ok: false; error: "nothing_to_pay" | "outstanding_changed" | "franchise_missing" };

export async function createPayout(
  franchiseId: string,
  values: { expected: number; paidOn: string; reference: string; note: string },
): Promise<PayoutResult> {
  const { data, error } = await createAdminClient()
    .rpc("create_franchise_payout", {
      p_franchise_id: franchiseId,
      p_expected: values.expected,
      p_paid_on: values.paidOn,
      p_reference: values.reference,
      p_note: values.note,
    })
    .single();
  if (error) {
    const code = ["nothing_to_pay", "outstanding_changed", "franchise_missing"].find((c) =>
      error.message.includes(c),
    );
    if (code) return { ok: false, error: code as "nothing_to_pay" };
    throw error;
  }
  const p = data as { id: string; amount: number; paid_on: string; reference: string; note: string | null; created_at: string };
  return {
    ok: true,
    payout: {
      id: p.id,
      amount: p.amount,
      paidOn: p.paid_on,
      reference: p.reference,
      note: p.note,
      createdAt: p.created_at,
    },
  };
}

// Clause 10.2: candidate-wise fees received and commission, for one month.
export function statementCsv(
  franchise: { name: string; code: string },
  month: string,
  ledger: Ledger,
) {
  const rows = ledger.commissions.filter((c) => monthKey(c.earnedAt) === month);
  const payouts = ledger.payouts.filter((p) => p.paidOn.startsWith(month));
  const rupees = (paise: number) => (paise / 100).toFixed(2);
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const line = (values: string[]) => values.map(cell).join(",");

  return [
    line([`Commission statement: ${franchise.name} (${franchise.code})`, month]),
    "",
    line(["Date", "Candidate", "Fee", "Amount candidate paid (INR)", "Commission (INR)", "Status"]),
    ...rows.map((c) =>
      line([
        c.earnedAt.slice(0, 10),
        c.candidateName,
        c.kind,
        rupees(c.baseAmount),
        rupees(c.amount),
        c.state,
      ]),
    ),
    "",
    line(["Payouts", "Reference", "Amount (INR)"]),
    ...payouts.map((p) => line([p.paidOn, p.reference, rupees(p.amount)])),
    "",
    line(["Commission earned this month (INR)", rupees(rows.filter((c) => c.state !== "cancelled").reduce((s, c) => s + c.amount, 0))]),
    line(["Paid out this month (INR)", rupees(payouts.reduce((s, p) => s + p.amount, 0))]),
    line(["Outstanding today (INR)", rupees(ledger.totals.outstanding)]),
  ].join("\n");
}
