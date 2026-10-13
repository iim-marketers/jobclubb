import { getCurrentCandidate } from "@/server/auth/current-candidate";
import { getMembershipInvoice, invoiceFilename } from "@/server/candidates/invoice";
import { renderInvoicePdf } from "@/server/candidates/invoice-pdf";
import { getPlacementInvoice } from "@/server/placements/payments";

// Deliberately not requireMember: invoices stay available after membership ends.
export async function GET(_request: Request, ctx: RouteContext<"/api/invoices/[paymentId]">) {
  const candidate = await getCurrentCandidate();
  if (!candidate) return new Response("Please sign in again.", { status: 401 });

  const { paymentId } = await ctx.params;
  const invoice =
    (await getMembershipInvoice(candidate.id, paymentId)) ??
    (await getPlacementInvoice(candidate.id, paymentId));
  if (!invoice) return new Response("Invoice not found.", { status: 404 });

  const pdf = await renderInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoiceFilename(invoice)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
