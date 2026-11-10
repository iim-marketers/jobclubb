import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateOnly, formatRupees } from "@/lib/placements";
import type { Payout } from "@/server/franchises/ledger";

export function PayoutsTable({
  payouts,
  showNotes = false,
}: {
  payouts: Payout[];
  showNotes?: boolean;
}) {
  const total = payouts.reduce((sum, p) => sum + p.amount, 0);
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="px-3">Date</TableHead>
            <TableHead className="px-3">Reference (UTR)</TableHead>
            {showNotes && (
              <TableHead className="hidden px-3 sm:table-cell">Note</TableHead>
            )}
            <TableHead className="px-3 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="px-3 whitespace-nowrap">
                {formatDateOnly(p.paidOn)}
              </TableCell>
              <TableCell className="max-w-48 truncate px-3 font-mono text-xs text-muted-foreground">
                {p.reference}
              </TableCell>
              {showNotes && (
                <TableCell
                  className="hidden max-w-48 truncate px-3 text-muted-foreground sm:table-cell"
                  title={p.note ?? undefined}
                >
                  {p.note ?? "—"}
                </TableCell>
              )}
              <TableCell className="px-3 text-right font-head font-bold whitespace-nowrap">
                {formatRupees(p.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {payouts.length > 1 && (
          <TableFooter className="bg-muted/30">
            <TableRow>
              <TableCell colSpan={2} className="px-3 font-medium">
                Total
              </TableCell>
              {showNotes && <TableCell className="hidden sm:table-cell" />}
              <TableCell className="px-3 text-right font-head font-extrabold whitespace-nowrap">
                {formatRupees(total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
