import { Download } from "lucide-react";

import { CommissionsTable } from "@/components/franchise/commissions-table";
import { Button } from "@/components/ui/button";
import {
  FRANCHISE_EARNINGS,
  STATEMENT_DISPUTE_DAYS,
  monthKey,
  monthLabel,
} from "@/lib/franchise";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireFranchise } from "@/server/franchises/current";
import { getLedger } from "@/server/franchises/ledger";

export const metadata = { title: "Earnings — JobClubb franchise" };

export default async function FranchiseEarningsPage() {
  const franchise = await requireFranchise(FRANCHISE_EARNINGS);
  const ledger = await getLedger(franchise.id);
  const months = [
    ...new Set([...ledger.commissions.map((c) => monthKey(c.earnedAt)), ...ledger.payouts.map((p) => p.paidOn.slice(0, 7))]),
  ]
    .sort()
    .reverse();
  const overdue = ledger.commissions.some((c) => c.state === "outstanding" && c.dueOn < todayIst());
  const hasBank = !!(franchise.bankAccountNo && franchise.bankIfsc);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">Earnings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          You earn half of what each candidate you registered pays JobClubb: their first membership
          fee and their placement fee. JobClubb pays within two working days of receiving it.
        </p>
      </div>

      {!hasBank && (
        <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          JobClubb doesn&apos;t have your bank details yet, so commission can&apos;t be transferred. Send
          them to support@jobclubb.com.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total earned", value: ledger.totals.earned },
          { label: "Paid to you", value: ledger.totals.paid },
          { label: overdue ? "To come · overdue" : "To come", value: ledger.totals.outstanding, warn: ledger.totals.outstanding > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-head text-2xl font-extrabold tracking-tight", s.warn && "text-amber-700 dark:text-amber-300")}>
              {formatRupees(s.value)}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-head text-lg font-bold tracking-tight">Commission</h2>
        <CommissionsTable commissions={ledger.commissions} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-head text-sm font-bold">Payments to you</h2>
          {ledger.payouts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {ledger.payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{formatDateOnly(p.paidOn)}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">UTR {p.reference}</p>
                  </div>
                  <span className="font-head font-bold">{formatRupees(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-head text-sm font-bold">Monthly statements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidate-wise fees and commission. If anything looks wrong, tell support@jobclubb.com within{" "}
            {STATEMENT_DISPUTE_DAYS} days.
          </p>
          {months.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Your first statement appears once you earn commission.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {months.map((m) => (
                <li key={m}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-head"
                    nativeButton={false}
                    render={<a href={`${FRANCHISE_EARNINGS}/statement?month=${m}`} download />}
                  >
                    <Download className="size-3.5" />
                    {monthLabel(m)}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
