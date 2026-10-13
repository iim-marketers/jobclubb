import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";

import {
  ExtendDeadlineForm,
  NotesForm,
  PlacementActions,
  RemoveDocumentButton,
  TermsForm,
  UploadDocumentsForm,
} from "@/components/admin/placement-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PLACEMENT_LABELS,
  MAX_OFFER_FILES,
  formatDateOnly,
  formatRupees,
  isReleased,
  placementBadge,
  todayIst,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/session";
import { getAdminPlacement } from "@/server/placements/placements";

export const metadata = { title: "Placement — JobClubb admin" };

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "—";

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <h2 className="font-head text-sm font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminPlacementPage({ params }: PageProps<"/admin/placements/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const p = await getAdminPlacement(id);
  if (!p) notFound();

  const released = isReleased(p.status);
  const today = todayIst();
  const can = {
    release: !released && p.documents.length > 0 && !!p.monthlySalary && !!p.joiningDate,
    decline: p.status === "released",
    joining: p.status === "accepted" && !!p.joiningDate && p.joiningDate <= today,
    withdraw: ["awaiting_offer", "offer_received", "released", "accepted"].includes(p.status),
  };
  const releaseBlocker = released
    ? null
    : p.documents.length === 0
      ? "Upload the offer letter before releasing."
      : !p.monthlySalary || !p.joiningDate
        ? "Add the monthly gross and joining date before releasing."
        : null;

  return (
    <div className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/admin/placements"
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All placements
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("font-head font-bold", placementBadge(p.status))}>
              {ADMIN_PLACEMENT_LABELS[p.status]}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{p.ref}</span>
          </div>
          <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">{p.candidateName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.designation} at {p.companyName}
            {p.propertyName ? ` (${p.propertyName})` : ""}
          </p>
        </div>
        <PlacementActions placementId={p.id} candidate={p.candidateName} can={can} />
      </div>
      {releaseBlocker && (
        <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {releaseBlocker}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Offer terms">
            {released ? (
              <div className="space-y-5">
                <Details
                  rows={[
                    ["Monthly gross", p.monthlySalary ? formatRupees(p.monthlySalary) : "—"],
                    ["Placement fee", p.fee ? formatRupees(p.fee) : "—"],
                    ["Pay by", p.offerDeadline ? formatDateOnly(p.offerDeadline) : "—"],
                    ["Joining date", p.joiningDate ? formatDateOnly(p.joiningDate) : "—"],
                  ]}
                />
                {p.notes && (
                  <p className="rounded-xl bg-muted/50 p-3 text-sm whitespace-pre-line">{p.notes}</p>
                )}
                {(p.status === "released" || p.status === "expired") && p.offerDeadline && p.joiningDate && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Extend the deadline or move the joining date. An expired offer reopens.
                    </p>
                    <ExtendDeadlineForm
                      placementId={p.id}
                      defaults={{ offerDeadline: p.offerDeadline, joiningDate: p.joiningDate }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <TermsForm
                placementId={p.id}
                defaults={{
                  monthlySalary: p.monthlySalary,
                  joiningDate: p.joiningDate,
                  offerDeadline: p.offerDeadline,
                  notes: p.notes,
                }}
              />
            )}
          </Card>

          <Card title={`Offer documents (${p.documents.length})`}>
            {p.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing uploaded yet. The company uploads the offer from its Selected page, or you can add it here.
              </p>
            ) : (
              <ul className="space-y-2">
                {p.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                    <FileText className="size-4 flex-none text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.max(1, Math.round(d.size / 1024))} KB · uploaded by {d.uploadedBy} on {formatDate(d.createdAt)}
                      </p>
                    </div>
                    {d.url && (
                      <Button variant="outline" size="sm" className="font-head" nativeButton={false} render={<a href={d.url} />}>
                        <Download className="size-3.5" /> Download
                      </Button>
                    )}
                    {!released && <RemoveDocumentButton placementId={p.id} documentId={d.id} name={d.name} />}
                  </li>
                ))}
              </ul>
            )}
            {p.status !== "withdrawn" && p.documents.length < MAX_OFFER_FILES && (
              <div className="mt-4 border-t border-border pt-4">
                <UploadDocumentsForm placementId={p.id} />
              </div>
            )}
          </Card>

          <Card title="Payments">
            {p.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment attempts yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {p.payments.map((pay) => (
                  <li key={pay.orderId} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span>
                      <span className="font-medium">{formatRupees(pay.amount)}</span>{" "}
                      <span className="text-muted-foreground">
                        {pay.status === "paid"
                          ? `paid ${formatDate(pay.paidAt)} · ${pay.invoiceNumber}`
                          : `checkout started ${formatDate(pay.createdAt)}, not completed`}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{pay.paymentId ?? pay.orderId}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Candidate">
            <Details
              rows={[
                ["Name", p.candidateName],
                ["Email", <a key="e" href={`mailto:${p.candidateEmail}`} className="text-brand">{p.candidateEmail}</a>],
                ["Phone", <a key="p" href={`tel:${p.candidatePhone}`} className="text-brand">{p.candidatePhone}</a>],
                ["City", p.candidateCity],
              ]}
            />
          </Card>
          <Card title="Company contact">
            <Details
              rows={[
                ["Name", `${p.companyContact.name}, ${p.companyContact.designation}`],
                ["Email", <a key="e" href={`mailto:${p.companyContact.email}`} className="text-brand">{p.companyContact.email}</a>],
                ["Phone", p.companyContact.phone],
              ]}
            />
          </Card>
          <Card title="Timeline">
            <Details
              rows={[
                ["Selected", formatDate(p.selectedAt)],
                ["Offer uploaded", formatDate(p.offerReceivedAt)],
                ["Released", formatDate(p.releasedAt)],
                ["Paid", formatDate(p.acceptedAt)],
                ["Closed", formatDate(p.closedAt)],
              ]}
            />
          </Card>
          <Card title="Internal notes">
            <NotesForm placementId={p.id} notes={p.adminNotes} />
          </Card>
        </div>
      </div>
    </div>
  );
}
