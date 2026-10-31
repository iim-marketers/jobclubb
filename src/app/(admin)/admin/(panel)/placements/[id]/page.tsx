import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import {
  CloseReplacementForm,
  LinkReplacementForm,
  PlacementActions,
  RemoveDocumentButton,
  TermsForm,
  UploadDocumentsForm,
} from "@/components/admin/placement-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PLACEMENT_LABELS,
  LEFT_REASONS,
  MAX_OFFER_FILES,
  REPLACEMENT_MONTHS,
  candidateCategory,
  formatDateOnly,
  formatRupees,
  placementBadge,
  todayIst,
  type PlacementStatus,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/session";
import {
  getAdminPlacement,
  listReplacementCandidates,
} from "@/server/placements/placements";

export const metadata = { title: "Placement — JobClubb admin" };

const SENDABLE: PlacementStatus[] = [
  "awaiting_offer",
  "offer_received",
  "released",
  "expired",
];

const REPLACEMENT_LABELS = {
  owed: "Owed",
  fulfilled: "Referred",
  waived: "Closed",
} as const;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "—";

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("p-6", className)}>
      <h2 className="font-head text-sm font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

function Disclosure({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-head text-sm font-semibold text-brand hover:text-brand-dark [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function ContactLine({
  icon: Icon,
  href,
  children,
}: {
  icon: typeof Mail;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 flex-none text-muted-foreground" />
      {href ? (
        <a href={href} className="min-w-0 break-all hover:text-brand">
          {children}
        </a>
      ) : (
        <span className="min-w-0">{children}</span>
      )}
    </li>
  );
}

export default async function AdminPlacementPage({
  params,
}: PageProps<"/admin/placements/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const p = await getAdminPlacement(id);
  if (!p) notFound();
  const replacementOptions =
    p.replacement?.status === "owed"
      ? await listReplacementCandidates(p.id)
      : [];

  const sendable = SENDABLE.includes(p.status);
  const today = todayIst();
  const can = {
    send:
      sendable &&
      p.documents.length > 0 &&
      !!p.monthlySalary &&
      !!p.joiningDate,
    decline: p.status === "offer_received" || p.status === "released",
    joining:
      p.status === "accepted" && !!p.joiningDate && p.joiningDate <= today,
    withdraw: [
      "awaiting_offer",
      "offer_received",
      "released",
      "accepted",
    ].includes(p.status),
  };
  const sendBlocker = !sendable
    ? null
    : p.documents.length === 0
      ? "Upload the offer letter before sending it."
      : !p.monthlySalary || !p.joiningDate
        ? "Add the monthly gross and joining date before sending the offer letter."
        : null;
  const fee = p.monthlySalary
    ? formatRupees(p.monthlySalary)
    : "one month's salary";
  const feeNote = p.fresher
    ? `Fresher Candidate (joined with an Emporium code). Contact them and collect their placement fee of ${fee} outside JobClubb before sending the offer letter. The company pays no recruitment fee.`
    : `Experienced Candidate. The candidate pays no fee. Once they join, invoice the company a recruitment fee of ${fee} plus GST, due within 15 days of receipt.`;
  const canUpload =
    p.status !== "withdrawn" && p.documents.length < MAX_OFFER_FILES;

  const terms = [
    ["Monthly gross", p.monthlySalary ? formatRupees(p.monthlySalary) : "—"],
    ["Candidate", candidateCategory(p.fresher)],
    ["Reply by", p.offerDeadline ? formatDateOnly(p.offerDeadline) : "—"],
    ["Joining date", p.joiningDate ? formatDateOnly(p.joiningDate) : "—"],
  ];
  const timeline = (
    [
      ["Selected", p.selectedAt],
      ["Offer uploaded", p.offerReceivedAt],
      [
        "Shown to candidate",
        p.releasedAt === p.acceptedAt ? null : p.releasedAt,
      ],
      ["Offer letter sent", p.acceptedAt],
      ["Closed", p.closedAt],
    ] as const
  ).filter(([, at]) => at);

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <Link
        href="/admin/placements"
        className="inline-flex items-center mb-6 gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All placements
      </Link>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn("font-head font-bold", placementBadge(p.status))}
              >
                {ADMIN_PLACEMENT_LABELS[p.status]}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {p.ref}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="font-head text-2xl font-extrabold tracking-tight">
                {p.candidateName}
              </h1>
              <Badge
                className={cn(
                  "font-head font-bold",
                  p.fresher
                    ? "bg-violet-500/12 text-violet-700 dark:text-violet-300"
                    : "bg-brand/10 text-brand",
                )}
              >
                {candidateCategory(p.fresher)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.designation} at {p.companyName}
              {p.propertyName ? ` (${p.propertyName})` : ""}
            </p>
          </div>
          <PlacementActions
            placementId={p.id}
            candidate={p.candidateName}
            fresher={p.fresher}
            monthlySalary={p.monthlySalary}
            can={can}
          />
        </div>
        {p.left && (
          <p className="rounded-2xl bg-orange-500/10 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
            The employer reported: {LEFT_REASONS[p.left.reason].toLowerCase()}
            {p.left.resignedOn && ` on ${formatDateOnly(p.left.resignedOn)}`},
            last working day {formatDateOnly(p.left.leftOn)}.
            {p.left.notes && ` “${p.left.notes}”`}
          </p>
        )}
        {p.replacement && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-head text-sm font-bold">Replacement</h2>
              <Badge
                className={cn(
                  "font-head font-bold",
                  p.replacement.status === "owed"
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : p.replacement.status === "fulfilled"
                      ? "bg-good/12 text-good"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {REPLACEMENT_LABELS[p.replacement.status]}
              </Badge>
            </div>
            {p.replacement.status === "owed" ? (
              <div className="mt-3 space-y-5">
                <p className="text-sm text-muted-foreground">
                  They resigned within {REPLACEMENT_MONTHS} months of joining,
                  so JobClubb owes {p.companyName} one replacement. Screen and
                  refer a candidate as usual, then link them here. If the job is
                  closed, ask the company to reopen it.
                </p>
                <LinkReplacementForm
                  placementId={p.id}
                  designation={p.designation}
                  options={replacementOptions}
                />
                <Disclosure label="Close without a replacement">
                  <CloseReplacementForm placementId={p.id} />
                </Disclosure>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {p.replacement.status === "fulfilled" ? (
                  <>
                    {p.replacement.ref ? (
                      <Link
                        href={`/admin/applications/${p.replacement.ref}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {p.replacement.candidate}
                      </Link>
                    ) : (
                      "A candidate"
                    )}{" "}
                    was referred as the replacement
                  </>
                ) : (
                  <>Closed without a replacement: “{p.replacement.note}”</>
                )}
                {p.replacement.closedAt &&
                  ` (${formatDate(p.replacement.closedAt)}).`}
              </p>
            )}
          </div>
        )}
        {sendBlocker && (
          <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {sendBlocker}
          </p>
        )}
        {/* {!["withdrawn", "declined", "not_joined"].includes(p.status) && (
          <p className="rounded-2xl bg-brand/6 px-4 py-3 text-sm">{feeNote}</p>
        )} */}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <Section title="Offer terms">
            {!sendable ? (
              <div className="space-y-6">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  {terms.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-head text-base font-bold">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {p.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Joining instructions
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                      {p.notes}
                    </p>
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
          </Section>

          <Section title="Offer documents">
            {p.documents.length === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Nothing uploaded yet. The company uploads the offer from its
                Selected page, or you can add it here.
              </p>
            ) : (
              <ul className="mb-4 space-y-3">
                {p.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3">
                    <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-brand/10">
                      <FileText className="size-4 text-brand" />
                    </span>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.max(1, Math.round(d.size / 1024))} KB · uploaded
                        by {d.uploadedBy} on {formatDate(d.createdAt)}
                      </p>
                    </div>
                    {d.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-head"
                        nativeButton={false}
                        render={<a href={d.url} />}
                      >
                        <Download className="size-3.5" /> Download
                      </Button>
                    )}
                    {sendable && (
                      <RemoveDocumentButton
                        placementId={p.id}
                        documentId={d.id}
                        name={d.name}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canUpload &&
              (p.documents.length === 0 ? (
                <UploadDocumentsForm placementId={p.id} />
              ) : (
                <Disclosure label="Upload another document">
                  <UploadDocumentsForm placementId={p.id} />
                </Disclosure>
              ))}
          </Section>
        </Panel>

        <Panel>
          <Section title="Candidate">
            <ul className="space-y-2.5 text-sm">
              <ContactLine icon={Mail} href={`mailto:${p.candidateEmail}`}>
                {p.candidateEmail}
              </ContactLine>
              <ContactLine icon={Phone} href={`tel:${p.candidatePhone}`}>
                {p.candidatePhone}
              </ContactLine>
              <ContactLine icon={MapPin}>{p.candidateCity}</ContactLine>
            </ul>
          </Section>

          <Section title="Company contact">
            <p className="text-sm font-medium">
              {p.companyContact.name}
              {p.companyContact.designation && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {p.companyContact.designation}
                </span>
              )}
            </p>
            <ul className="mt-2.5 space-y-2.5 text-sm">
              <ContactLine
                icon={Mail}
                href={`mailto:${p.companyContact.email}`}
              >
                {p.companyContact.email}
              </ContactLine>
              <ContactLine icon={Phone} href={`tel:${p.companyContact.phone}`}>
                {p.companyContact.phone}
              </ContactLine>
            </ul>
          </Section>

          <Section title="Timeline">
            <ol className="space-y-2.5 text-sm">
              {timeline.map(([label, at]) => (
                <li key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{formatDate(at)}</span>
                </li>
              ))}
            </ol>
          </Section>
        </Panel>
      </div>
    </div>
  );
}
