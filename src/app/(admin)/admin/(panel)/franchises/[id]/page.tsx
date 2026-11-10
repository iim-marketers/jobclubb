import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleCheck,
  Download,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { AccordionSections } from "@/components/accordion-sections";
import { CopyCode } from "@/components/copy-code";
import {
  AdminCommissionsTable,
  ApproveForm,
  FranchiseCandidatesTable,
  FranchiseForm,
  FranchiseStatusBadge,
  PayoutForm,
  RejectButton,
  TermActions,
} from "@/components/admin/franchise-admin";
import { Badge } from "@/components/ui/badge";
import { PayoutsTable } from "@/components/franchise/payouts-table";
import { Button } from "@/components/ui/button";
import {
  constitutionLabel,
  daysBetween,
  franchiseStatus,
  lastDayOf,
  monthKey,
  monthLabel,
} from "@/lib/franchise";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/session";
import {
  getFranchise,
  isApproved,
  listFranchiseCandidates,
  type Franchise,
} from "@/server/franchises/franchises";
import { getLedger } from "@/server/franchises/ledger";

export const metadata = { title: "Franchise — JobClubb admin" };

const TABS = [
  { key: "candidates", label: "Candidates" },
  { key: "commission", label: "Commission" },
  { key: "details", label: "Details" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "warn" | "good";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-head text-xl font-extrabold tracking-tight",
          tone === "warn" && "text-amber-700 dark:text-amber-300",
          tone === "good" && "text-good",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminFranchisePage({
  params,
  searchParams,
}: PageProps<"/admin/franchises/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { tab: rawTab, created, edit } = await searchParams;
  const found = await getFranchise(id);
  if (!found) notFound();
  if (!isApproved(found))
    return <SignUpReview franchise={found} editing={edit === "1"} />;
  const franchise = found;
  const tab: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "candidates";

  const [candidates, ledger] = await Promise.all([
    listFranchiseCandidates(franchise.id),
    getLedger(franchise.id),
  ]);
  const status = franchiseStatus(franchise);
  const today = todayIst();
  const lastDay = lastDayOf(franchise);
  const daysLeft = daysBetween(today, lastDay);
  const placed = candidates.filter((c) => c.placement === "joined").length;
  const outstandingRows = ledger.commissions.filter(
    (c) => c.state === "outstanding",
  );
  const overdue = outstandingRows.some((c) => c.dueOn < today);
  const hasBank = !!(franchise.bankAccountNo && franchise.bankIfsc);
  const months = [
    ...new Set(ledger.commissions.map((c) => monthKey(c.earnedAt))),
  ]
    .sort()
    .reverse();

  const details: [string, string][] = [
    ["Legal name", franchise.legalName],
    ["Constitution", constitutionLabel(franchise.constitution)],
    ["Represented by", franchise.ownerName],
    ["PAN", franchise.pan],
    ["GSTIN", franchise.gstin ?? "—"],
    ["Outlet", franchise.outletAddress],
    ["Area", franchise.areaSqft ? `${franchise.areaSqft} sq ft` : "—"],
    [
      "Territory",
      `${franchise.territory} (${franchise.exclusive ? "exclusive" : "non-exclusive"})`,
    ],
    [
      "Agreement",
      `${formatDateOnly(franchise.startsOn)} to ${formatDateOnly(franchise.endsOn)}`,
    ],
    [
      "Franchise fee",
      franchise.franchiseFee !== null
        ? `${formatRupees(franchise.franchiseFee)} + GST${franchise.feePaidOn ? `, paid ${formatDateOnly(franchise.feePaidOn)}` : ""}`
        : "—",
    ],
    [
      "Fee payment",
      franchise.feePaymentMode && franchise.feeTransactionId
        ? `${franchise.feePaymentMode} · Txn ${franchise.feeTransactionId}`
        : "Not recorded",
    ],
    [
      "Bank",
      hasBank
        ? `${franchise.bankAccountName} · ${franchise.bankName} · A/c ${franchise.bankAccountNo} · ${franchise.bankIfsc}`
        : "Not added yet",
    ],
  ];

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <Link
        href="/admin/franchises"
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All franchises
      </Link>

      {created === "1" && (
        <p className="flex items-start gap-2 rounded-2xl bg-good/10 px-4 py-3 text-sm text-good">
          <CircleCheck className="mt-0.5 size-4 flex-none" />
          Franchise created. Share its sign-in email and the password you set
          with {franchise.ownerName}. They can change the password from the
          sign-in page with Forgot password.
        </p>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FranchiseStatusBadge status={status} />
            <CopyCode code={franchise.code} />
          </div>
          <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
            {franchise.name}
          </h1>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {franchise.city},{" "}
              {franchise.pincode}
            </li>
            <li>
              <a
                href={`mailto:${franchise.email}`}
                className="flex items-center gap-1.5 hover:text-brand"
              >
                <Mail className="size-3.5" /> {franchise.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${franchise.phone}`}
                className="flex items-center gap-1.5 hover:text-brand"
              >
                <Phone className="size-3.5" /> {franchise.phone}
              </a>
            </li>
          </ul>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {status === "upcoming"
              ? `Agreement starts ${formatDateOnly(franchise.startsOn)}. The franchise can sign in but can't register candidates until then.`
              : status === "active"
                ? `Agreement in force until ${formatDateOnly(lastDay)} (${daysLeft} ${daysLeft === 1 ? "day" : "days"} left)${franchise.terminatedOn ? `, terminated: ${franchise.terminationNote}` : ""}.`
                : status === "terminated"
                  ? `Terminated, last day ${formatDateOnly(lastDay)}: ${franchise.terminationNote}`
                  : `Agreement ended ${formatDateOnly(lastDay)}.`}
          </p>
        </div>
        <TermActions franchise={franchise} status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Candidates registered" value={candidates.length} />
        <Stat
          label="Paid membership"
          value={candidates.filter((c) => c.membershipPaidAt).length}
        />
        <Stat
          label="Placed"
          value={placed}
          tone={placed ? "good" : undefined}
        />
        <Stat
          label="Commission earned"
          value={formatRupees(ledger.totals.earned)}
        />
        <Stat label="Paid out" value={formatRupees(ledger.totals.paid)} />
        <Stat
          label={overdue ? "To pay · overdue" : "To pay"}
          value={formatRupees(ledger.totals.outstanding)}
          tone={ledger.totals.outstanding > 0 ? "warn" : undefined}
        />
      </div>

      <nav
        aria-label="Franchise sections"
        className="flex gap-1 border-b border-border"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={
              t.key === "candidates"
                ? `/admin/franchises/${id}`
                : `/admin/franchises/${id}?tab=${t.key}`
            }
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 border-transparent px-3 py-2.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              tab === t.key && "border-brand text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "candidates" && (
        <FranchiseCandidatesTable candidates={candidates} />
      )}

      {tab === "commission" && (
        <div className="space-y-6">
          {ledger.totals.outstanding > 0 && (
            <section className="rounded-2xl border border-amber-500/30 bg-card p-5">
              <h2 className="font-head font-bold">
                {formatRupees(ledger.totals.outstanding)} to pay
                {overdue && (
                  <span className="ml-2 text-sm font-semibold text-destructive">
                    Overdue
                  </span>
                )}
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Transfer it to the franchise&apos;s bank account, then record
                the transfer here. It settles every outstanding entry below, and
                the franchise is emailed.
              </p>
              <PayoutForm
                franchiseId={franchise.id}
                outstanding={ledger.totals.outstanding}
                hasBank={hasBank}
              />
            </section>
          )}

          <AdminCommissionsTable
            commissions={ledger.commissions}
            franchiseId={franchise.id}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-head text-sm font-bold">Payouts</h2>
              {ledger.payouts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No payouts yet.
                </p>
              ) : (
                <div className="mt-3">
              <PayoutsTable payouts={ledger.payouts} showNotes />
            </div>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-head text-sm font-bold">
                Monthly statements
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Candidate-wise fees and commission (clause 10.2). The franchise
                downloads the same statement from its dashboard.
              </p>
              {months.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing earned yet.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {months.map((m) => (
                    <li key={m}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-head"
                        nativeButton={false}
                        render={
                          <a
                            href={`/admin/franchises/${id}/statement?month=${m}`}
                            download
                          />
                        }
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
      )}

      {tab === "details" && (
        <div className="space-y-6">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm leading-6 break-words">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <h2 className="mb-3 font-head text-lg font-bold tracking-tight">
              Edit details
            </h2>
            <FranchiseForm franchise={franchise} />
          </div>
        </div>
      )}
    </div>
  );
}

function SignUpReview({
  franchise: f,
  editing,
}: {
  franchise: Franchise;
  editing: boolean;
}) {
  const pending = f.status === "pending";
  const details: [string, string][] = [
    ["Legal name", `${f.legalName} · ${constitutionLabel(f.constitution)}`],
    ["Represented by", f.ownerName],
    ["PAN", f.pan],
    ["GSTIN", f.gstin ?? "—"],
    ["Outlet", `${f.outletAddress}, ${f.city} ${f.pincode}`],
    ["Area", f.areaSqft ? `${f.areaSqft} sq ft` : "—"],
    ["Registered address", f.registeredAddress],
    [
      "Bank",
      f.bankAccountNo && f.bankIfsc
        ? `${f.bankName} · A/c ${f.bankAccountNo} · ${f.bankIfsc}`
        : "Not given yet",
    ],
  ];

  return (
    <div className="flex-1 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/admin/franchises?tab=sign-ups"
          className="inline-flex mb-4 items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All sign-ups
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge
              className={cn(
                "font-head font-bold",
                pending
                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {pending ? "Awaiting approval" : "Rejected"}
            </Badge>
            <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
              {f.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed up {formatDateOnly(todayIst(new Date(f.createdAt)))} ·{" "}
              <span className={f.emailVerifiedAt ? "text-good" : undefined}>
                {f.emailVerifiedAt
                  ? "Email confirmed"
                  : "Email not confirmed yet"}
              </span>
            </p>
          </div>
          {pending && <RejectButton franchiseId={f.id} />}
        </div>
        {!pending && f.reviewNote && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Rejected: {f.reviewNote}. You can still approve them below.
          </p>
        )}
        <section className="rounded-3xl border border-border bg-card px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-head text-xl font-extrabold tracking-tight">
              Application
            </h2>
            <a
              href="?edit=1#correct-details"
              className="font-head text-sm font-semibold text-brand hover:underline"
            >
              Edit
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <a
              href={`mailto:${f.email}`}
              className="flex items-center gap-1.5 hover:text-brand"
            >
              <Mail className="size-3.5" /> {f.email}
            </a>
            <a
              href={`tel:${f.phone}`}
              className="flex items-center gap-1.5 hover:text-brand"
            >
              <Phone className="size-3.5" /> {f.phone}
            </a>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm leading-6 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <ApproveForm franchise={f} />
        <div id="correct-details" className="scroll-mt-20">
          <AccordionSections
            key={editing ? "editing" : "closed"}
            defaultOpen={editing ? "correct-details" : ""}
            sections={[
              {
                value: "correct-details",
                title: "Correct their details",
                description:
                  "Fix typos in their business, outlet or bank details before approving.",
                content: (
                  <div className="bg-muted/20 p-4 sm:p-6">
                    <FranchiseForm franchise={f} showTerms={false} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
