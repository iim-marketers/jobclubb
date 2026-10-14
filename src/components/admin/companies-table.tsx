"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  Phone,
  TriangleAlert,
} from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import {
  adminTableFeatures,
  DataTable,
  formatDate,
  industryName,
} from "@/components/admin/data-table";
import { FilterSelect } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY_SIZES } from "@/lib/company-verification";
import { cn } from "@/lib/utils";
import type { AdminCompany, CompanyStatus } from "@/server/admin/companies";

const STATUS: Record<CompanyStatus, { label: string; className: string }> = {
  pending_email: {
    label: "Awaiting email",
    className: "bg-muted text-muted-foreground",
  },
  verified: { label: "Verified", className: "bg-good/12 text-good" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
  },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "pending_email", label: "Awaiting email" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const sizeLabel = (size: string) =>
  COMPANY_SIZES.find((s) => s.value === size)?.label ?? size;

function StatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <Badge className={cn("font-head font-bold", STATUS[status].className)}>
      {STATUS[status].label}
    </Badge>
  );
}

const helper = createColumnHelper<typeof adminTableFeatures, AdminCompany>();

const COLUMNS = helper.columns([
  helper.accessor("companyName", {
    header: "Company",
    sortFn: "text",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="min-w-44">
          <p className="font-head font-bold">{c.companyName}</p>
          <p className="text-xs text-muted-foreground">
            {[c.propertyName, industryName(c.industry)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      );
    },
  }),
  helper.accessor("contactName", {
    header: "Contact",
    sortFn: "text",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="min-w-44">
          <p className="font-medium">{c.contactName}</p>
          <p className="text-xs text-muted-foreground">{c.email}</p>
        </div>
      );
    },
  }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("city", {
    header: "City",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor("size", {
    header: "Size",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.size}
      </span>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    sortFn: "text",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor("createdAt", {
    header: "Registered",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDate(getValue())}
      </span>
    ),
  }),
]);

const COLUMN_CLASS: Record<string, string> = {
  email: "hidden",
  contactName: "hidden md:table-cell",
  city: "hidden lg:table-cell",
  size: "hidden xl:table-cell",
  createdAt: "hidden lg:table-cell",
};

export function CompaniesTable({ companies }: { companies: AdminCompany[] }) {
  const counts = useMemo(() => {
    const byStatus: Record<CompanyStatus, number> = {
      pending_email: 0,
      verified: 0,
      rejected: 0,
    };
    companies.forEach((c) => byStatus[c.status]++);
    return byStatus;
  }, [companies]);

  const [tab, setTab] = useState<TabKey>("all");
  const [viewingId, setViewingId] = useState<string>();

  const viewing = companies.find((c) => c.id === viewingId);
  const data = useMemo(
    () =>
      tab === "all" ? companies : companies.filter((c) => c.status === tab),
    [companies, tab],
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Registered" value={companies.length} />
        <StatTile label="Verified" value={counts.verified} />
        <StatTile label="Awaiting email" value={counts.pending_email} />
      </div>

      <DataTable
        key={tab}
        data={data}
        columns={COLUMNS}
        getRowId={(c) => c.id}
        searchable={["companyName", "contactName", "email", "city"]}
        searchPlaceholder="Search company, contact, email or city"
        initialSort={{ id: "createdAt", desc: true }}
        columnClass={COLUMN_CLASS}
        onRowClick={(c) => setViewingId(c.id)}
        emptyTitle="No companies in this view"
        toolbar={
          <FilterSelect
            label="Status"
            options={TABS.map((t) => ({ value: t.key, label: t.label }))}
            value={tab}
            onChange={setTab}
          />
        }
      />

      <CompanyDialog
        company={viewing}
        onClose={() => setViewingId(undefined)}
      />

    </>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-head text-2xl font-extrabold tracking-tight">
        {value}
      </p>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const websiteHref = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

function timeAgo(value: string) {
  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86_400_000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

const LINK = "inline-flex items-center gap-1 text-brand hover:underline";

function CompanyDialog({
  company,
  onClose,
}: {
  company?: AdminCompany;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!company} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {company && (
          <>
            <DialogHeader className="gap-0 border-b border-border bg-linear-to-b from-brand/8 to-transparent px-5 pt-6 pb-5 sm:px-7">
              <div className="flex items-start gap-4 pr-8">
                <div className="flex size-14 flex-none items-center justify-center rounded-2xl bg-brand font-head text-lg font-extrabold text-brand-foreground shadow-sm ring-4 ring-brand/10">
                  {initials(company.companyName)}
                </div>
                <div className="min-w-0 flex-1">
                  <StatusBadge status={company.status} />
                  <DialogTitle className="mt-2 font-head text-xl leading-tight font-extrabold sm:text-2xl">
                    {company.companyName}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {[
                      company.propertyName,
                      industryName(company.industry),
                      company.city,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </DialogDescription>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <QuickLink href={`mailto:${company.email}`} icon={Mail}>
                  Email
                </QuickLink>
                <QuickLink href={`tel:${company.phone}`} icon={Phone}>
                  Call
                </QuickLink>
                {company.website && (
                  <QuickLink
                    href={websiteHref(company.website)}
                    icon={Globe}
                    external
                  >
                    Website
                  </QuickLink>
                )}
                {company.proofUrl && (
                  <QuickLink href={company.proofUrl} icon={FileText} external>
                    Document
                  </QuickLink>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
              {!company.emailVerifiedAt && company.status !== "rejected" && (
                <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                  <TriangleAlert className="mt-0.5 size-4 flex-none text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium">Email not confirmed</p>
                    <p className="text-xs opacity-80">
                      This company can&apos;t sign in until it confirms its
                      email.
                    </p>
                  </div>
                </div>
              )}

              <VerificationChecks
                steps={[
                  {
                    label: "Registered",
                    done: true,
                    detail: formatDate(company.createdAt),
                  },
                  {
                    label: "Email confirmed",
                    done: !!company.emailVerifiedAt,
                    detail: company.emailVerifiedAt
                      ? formatDate(company.emailVerifiedAt)
                      : "Waiting",
                  },
                  {
                    label: "Business document",
                    done: !!company.proofUrl,
                    detail: company.proofUrl ? (
                      <a
                        href={company.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={LINK}
                      >
                        View file
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      "Not uploaded"
                    ),
                  },
                ]}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailGroup title="Company">
                  <Detail label="Size" value={sizeLabel(company.size)} />
                  <Detail
                    label="GSTIN"
                    value={company.gstin}
                    copy={company.gstin}
                    mono
                  />
                  <Detail
                    label="Location"
                    value={`${company.city} — ${company.pincode}`}
                  />
                  <Detail
                    label="Website"
                    value={
                      company.website ? (
                        <a
                          href={websiteHref(company.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(LINK, "break-all")}
                        >
                          {company.website.replace(/^https?:\/\//i, "")}
                        </a>
                      ) : null
                    }
                  />
                </DetailGroup>

                <DetailGroup title="Contact">
                  <Detail label="Name" value={company.contactName} />
                  <Detail label="Role" value={company.designation} />
                  <Detail
                    label="Email"
                    value={
                      <span className="block truncate" title={company.email}>
                        {company.email}
                      </span>
                    }
                    copy={company.email}
                  />
                  <Detail
                    label="Phone"
                    value={company.phone}
                    copy={company.phone}
                  />
                </DetailGroup>
              </div>
            </div>

            <DialogFooter className="m-0 items-center rounded-b-xl px-5 py-4 sm:justify-start sm:px-7">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Registered {timeAgo(company.createdAt)}
              </p>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type IconType = React.ComponentType<{ className?: string }>;

function QuickLink({
  href,
  icon: Icon,
  external,
  children,
}: {
  href: string;
  icon: IconType;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(
        buttonVariants({ variant: "outline", size: "xs" }),
        "rounded-full bg-card px-3 font-head",
      )}
    >
      <Icon />
      {children}
    </a>
  );
}

function SectionTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        "mb-3 flex items-center gap-1.5 font-head text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </h3>
  );
}

type Step = { label: string; done: boolean; detail: React.ReactNode };

const CONNECTOR = {
  first: {
    toMiddle: "left-6 w-[calc(150%-36px)]",
    toLast: "left-6 w-[calc(200%-48px)]",
  },
  middle: {
    toMiddle: "left-[calc(50%+12px)] w-[calc(100%-24px)]",
    toLast: "left-[calc(50%+12px)] w-[calc(150%-36px)]",
  },
};

function VerificationChecks({ steps }: { steps: Step[] }) {
  return (
    <section>
      <SectionTitle>Verification</SectionTitle>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0">
        {steps.map((step, i) => {
          const next = steps[i + 1];
          const first = i === 0;
          const last = !next;
          return (
            <li
              key={step.label}
              className={cn(
                "relative flex items-start gap-3 sm:flex-col sm:gap-2",
                first
                  ? "sm:items-start"
                  : last
                    ? "sm:items-end sm:text-right"
                    : "sm:items-center sm:text-center",
              )}
            >
              {next && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[11px] hidden h-0.5 sm:block",
                    CONNECTOR[first ? "first" : "middle"][
                      i + 1 === steps.length - 1 ? "toLast" : "toMiddle"
                    ],
                    step.done && next.done ? "bg-good/40" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative flex size-6 flex-none items-center justify-center rounded-full",
                  step.done
                    ? "bg-good/10 text-good ring-1 ring-good/25"
                    : "border-2 border-dashed border-border bg-background text-muted-foreground",
                )}
              >
                {step.done ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <Clock className="size-3" />
                )}
              </span>
              <div className="min-w-0 text-sm">
                <p
                  className={cn(
                    "font-medium",
                    !step.done && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                <div className="text-xs text-muted-foreground">
                  {step.detail}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <SectionTitle>{title}</SectionTitle>
      <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
        {children}
      </dl>
    </section>
  );
}

function Detail({
  label,
  value,
  copy,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  copy?: string | null;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="pt-px text-xs leading-5 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "group/detail flex min-w-0 items-start gap-1.5 break-words",
          mono && value && "font-mono text-xs leading-5",
        )}
      >
        <span className="min-w-0">
          {value ?? <span className="text-muted-foreground">—</span>}
        </span>
        {copy && <CopyButton value={copy} label={label} />}
      </dd>
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label.toLowerCase()}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-0.5 flex-none rounded p-0.5 text-muted-foreground opacity-0 transition-opacity outline-none group-hover/detail:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 [@media(hover:none)]:opacity-100"
    >
      {copied ? (
        <Check className="size-3.5 text-good" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
